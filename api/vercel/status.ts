export default async function handler(req: any, res: any) {
  console.log(`[${new Date().toISOString()}] GET /api/vercel/status - Request received`);
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const accessToken = process.env.VERCEL_ACCESS_TOKEN;
    console.log("DEBUG: VERCEL_PROJECT_ID present:", !!projectId);
    console.log("DEBUG: VERCEL_ACCESS_TOKEN present:", !!accessToken);

    // Usage Data placeholder
    let usageData = { 
      metrics: {
        bandwidth: "0 GB",
        requests: "0",
        edgeRequests: "0"
      }, 
      topQueries: [] 
    };

    if (!projectId || !accessToken) {
      console.log("Vercel Project ID or Access Token missing, returning mock data");
      return res.json({
        project: {
          id: 'mock-project',
          name: 'MemberHub',
          framework: 'nextjs',
          nodeVersion: '18.x',
          envCount: 5,
          updatedAt: new Date().toISOString()
        },
        latestDeployment: {
          readyState: 'READY',
          url: 'memberhub-demo.vercel.app',
          createdAt: Date.now()
        },
        deployments: [
          {
            uid: 'd1',
            name: 'memberhub',
            url: 'memberhub-demo.vercel.app',
            state: 'READY',
            creator: 'Yuval Shalev',
            createdAt: Date.now() - 86400000
          }
        ],
        usage: usageData,
        speedInsights: {
          performance: 98,
          accessibility: 100,
          bestPractices: 100,
          seo: 100
        }
      });
    }

    const url = `https://api.vercel.com/v9/projects/${projectId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Vercel API returned error: ${JSON.stringify(errorData)}. Returning mock data.`);
      return res.json({
        project: {
          id: projectId,
          name: 'MemberHub',
          framework: 'nextjs',
          nodeVersion: '18.x',
          envCount: 0,
          updatedAt: new Date().toISOString()
        },
        latestDeployment: {
          readyState: 'READY',
          url: 'memberhub-demo.vercel.app',
          createdAt: Date.now()
        },
        deployments: [],
        usage: usageData,
        speedInsights: {
          performance: 98,
          accessibility: 100,
          bestPractices: 100,
          seo: 100
        }
      });
    }

    const projectData = await response.json();
    
    // Fetch deployments
    const deploymentsUrl = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`;
    const deploymentsResponse = await fetch(deploymentsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    let deployments = [];
    let latestDeployment = null;
    
    if (deploymentsResponse.ok) {
      const deploymentsData = await deploymentsResponse.json();
      deployments = deploymentsData.deployments || [];
      latestDeployment = deployments[0] || null;
    }

    res.json({
      project: {
        id: projectData.id,
        name: projectData.name,
        framework: projectData.framework,
        nodeVersion: projectData.nodeVersion,
        envCount: projectData.env?.length || 0,
        updatedAt: projectData.updatedAt
      },
      latestDeployment,
      deployments,
      usage: usageData,
      speedInsights: {
        performance: 98,
        accessibility: 100,
        bestPractices: 100,
        seo: 100
      }
    });
  } catch (err: any) {
    console.error("Vercel status fetch failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch Vercel status" });
  }
}
