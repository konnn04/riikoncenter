import { NextResponse } from 'next/server';
import { AppManifest, FALLBACK_BUILTIN_APPS } from '../../../lib/apps';
import { EXTERNAL_MANIFESTS } from '../../../lib/external-manifests';

// Type definition for GitHub API Repo response (partial)
interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  default_branch: string;
  topics: string[];
}

export async function GET() {
  const orgName = process.env.NEXT_PUBLIC_GITHUB_ORG;

  if (!orgName) {
    console.warn('NEXT_PUBLIC_GITHUB_ORG is not configured in environment variables. Falling back to built-in apps.');
    return NextResponse.json({ apps: FALLBACK_BUILTIN_APPS });
  }

  try {

    // Fetch repositories from our Backend using GitHub App auth
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';
    const reposRes = await fetch(`${apiUrl}/api/v1/github/org-repos/${orgName}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!reposRes.ok) {
      console.error('Failed to fetch repositories from GitHub:', await reposRes.text());
      // Fallback to built-in apps if GitHub API fails
      return NextResponse.json({ apps: FALLBACK_BUILTIN_APPS });
    }

    const responseJson = await reposRes.json();
    // Support both raw array (old) and standardized { data } envelope (new)
    const repos: GitHubRepo[] = Array.isArray(responseJson) ? responseJson : (responseJson.data || []);
    const thirdPartyApps: AppManifest[] = [];

    // Process each repo concurrently
    const repoPromises = repos.map(async (repo) => {
      // Ignore the riikoncenter repo itself if it's in the same org
      if (repo.name.toLowerCase() === 'riikoncenter') return null;

      try {
        // Fetch manifest via backend
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';
        const manifestUrl = `${apiUrl}/api/v1/github/org-repos/${orgName}/${repo.name}/file/riikoncenter-manifest.json`;
        const manifestRes = await fetch(manifestUrl, {
          next: { revalidate: 3600 },
        });

        if (manifestRes.ok) {
          const { data: rawManifest } = await manifestRes.json();
          if (rawManifest) {
            const manifestData = typeof rawManifest === 'string' ? JSON.parse(rawManifest) : rawManifest;
            
            let readme = undefined;
            try {
              const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';
              const readmeRes = await fetch(`${apiUrl}/api/v1/github/org-repos/${orgName}/${repo.name}/readme`, {
                next: { revalidate: 3600 },
              });
              if (readmeRes.ok) {
                const { data } = await readmeRes.json();
                if (data) readme = data;
              }
            } catch (e) {
              console.warn(`Failed to fetch readme for ${repo.name}`);
            }

            // Ensure it's marked as third-party and has a fallback repoUrl
            return {
              ...manifestData,
              type: 'third-party',
              repoUrl: manifestData.repoUrl || repo.html_url,
              readme: manifestData.readme || readme,
            } as AppManifest;
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch/parse manifest for ${repo.name}`, err);
      }

      let readme = undefined;
      try {
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';
        const readmeRes = await fetch(`${apiUrl}/api/v1/github/org-repos/${orgName}/${repo.name}/readme`, {
          next: { revalidate: 3600 },
        });
        if (readmeRes.ok) {
          const { data } = await readmeRes.json();
          if (data) readme = data;
        }
      } catch (e) {
        console.warn(`Failed to fetch readme for fallback ${repo.name}`);
      }

      // Fallback: If no remote manifest exists, check local config first
      const localConfig = EXTERNAL_MANIFESTS[repo.name] || {};

      return {
        id: localConfig.id || repo.name,
        name: localConfig.name || repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: localConfig.description || repo.description || 'No description provided.',
        category: localConfig.category || 'utility',
        type: 'third-party',
        icon: localConfig.icon || 'Box',
        version: localConfig.version || '1.0.0',
        author: localConfig.author || orgName,
        entryPath: localConfig.entryPath || repo.html_url, // For fallback apps, clicking "Open" will just go to the GitHub Repo
        tags: localConfig.tags || repo.topics || [],
        repoUrl: localConfig.repoUrl || repo.html_url,
        readme: localConfig.readme || readme,
        bannerBg: localConfig.bannerBg,
        iconUrl: localConfig.iconUrl,
        screenshots: localConfig.screenshots,
        status: localConfig.status,
      } as AppManifest;
    });

    const results = await Promise.all(repoPromises);
    
    // Filter out nulls
    results.forEach(app => {
      if (app) thirdPartyApps.push(app);
    });

    // Combine built-in apps with third-party apps
    const allApps = [...FALLBACK_BUILTIN_APPS, ...thirdPartyApps];

    return NextResponse.json({ apps: allApps });
  } catch (error) {
    console.error('API /apps error:', error);
    return NextResponse.json({ apps: FALLBACK_BUILTIN_APPS });
  }
}
