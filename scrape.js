const axios = require('axios');
const fs = require('fs');
const slugify = require('slugify');
require('dotenv').config();

async function crawlWebsite(url) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const apiBase = process.env.FIRECRAWL_API_URL;

    // Wysłanie zapytania do Firecrawl API
    const crawlResponse = await axios.post(
      `${apiBase}/v0/crawl`,
      {
        url: url,
        crawlerOptions: {
          limit: 500,           // Maksymalnie 200 stron
          maxDepth: 10,         // Maksymalna głębokość 10
          includes: ["/2013/", "/2014/"],  // Włącz tylko strony z 2013 i 2014
        },
        wait_until_done: true   // Czekamy na zakończenie procesu crawl
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const jobId = crawlResponse.data.jobId;
    const statusEndpoint = `${apiBase}/v0/crawl/status/${jobId}`;
    let jobStatus = 'active';
    let statusData = null;

    while (jobStatus === 'active') {
      const statusResponse = await axios.get(statusEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      jobStatus = statusResponse.data.status;
      const current = statusResponse.data.current;
      const total = statusResponse.data.total;
      statusData = statusResponse.data

      console.log(`Crawling in progress: ${current}/${total} pages completed`);

      if (jobStatus === 'active') {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (jobStatus === 'completed') {
      const pages = statusData.data;

      pages.forEach((page) => {
        const pageUrl = page.metadata.sourceURL;
        console.log('Processing page:', pageUrl);
        const year = pageUrl.match(/\/(\d{4})\//);

        if (year && (year[1] === '2013' || year[1] === '2014')) {
          const markdownContent = page.markdown;
          const titleSlug = slugify(page.metadata.title || pageUrl, {
            lower: true,
            strict: true,
          });

          // Zapis markdown do pliku
          const filePath = `markdown/${titleSlug}.md`;
          fs.writeFileSync(filePath, markdownContent, 'utf8');
          console.log(`Saved markdown content to ${filePath}`);
        }
      });
    } else {
      console.log(jobStatus, statusData)
      console.error('Crawl job did not complete successfully.');
    }
  } catch (error) {
    console.log(error);
    console.error('An error occurred:', error.message);
  }
}

// Użycie funkcji
crawlWebsite('http://himalaje.jama-tur.pl');
