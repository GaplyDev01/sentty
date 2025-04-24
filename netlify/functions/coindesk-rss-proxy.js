// Proxy function to fetch CoinDesk RSS feed and avoid CORS issues
const fetch = require('node-fetch');
const { DOMParser } = require('xmldom');

exports.handler = async function(event, context) {
  try {
    // CoinDesk RSS feed URL
    const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsAggregator/1.0)'
      }
    });
    
    // Get the content type to verify we received XML
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      console.error(`Failed to fetch CoinDesk RSS feed: ${response.status} ${response.statusText}`);
      return {
        statusCode: 200, // Return 200 even for errors to handle them gracefully in the frontend
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Failed to fetch CoinDesk RSS feed: ${response.status} ${response.statusText}`,
          items: [] // Include empty items array so the component can handle it
        })
      };
    }
    
    const text = await response.text();
    
    // Check if the response looks like XML before parsing
    if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<rss')) {
      console.error('Invalid RSS format received from CoinDesk');
      console.error('Response content type:', contentType);
      console.error('Response starts with:', text.substring(0, 100));
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid RSS format received from CoinDesk',
          items: [] // Include empty items array so the component can handle it
        })
      };
    }
    
    // Parse the XML
    const parser = new DOMParser({
      errorHandler: {
        warning: function(w) { console.warn(w); },
        error: function(e) { console.error(e); },
        fatalError: function(e) { console.error('Fatal: ' + e); }
      }
    });
    
    const xml = parser.parseFromString(text, 'application/xml');
    
    // Check if parsing was successful
    if (!xml || !xml.getElementsByTagName) {
      throw new Error('Failed to parse XML');
    }
    
    // Extract channel information
    const channels = xml.getElementsByTagName('channel');
    if (!channels || channels.length === 0) {
      throw new Error('No channel element found in RSS feed');
    }
    
    const channel = channels[0];
    const title = channel.getElementsByTagName('title')[0]?.textContent || 'CoinDesk RSS';
    const description = channel.getElementsByTagName('description')[0]?.textContent || '';
    const link = channel.getElementsByTagName('link')[0]?.textContent || 'https://www.coindesk.com';
    
    // Extract all items
    const itemElements = xml.getElementsByTagName('item');
    const items = [];
    
    for (let i = 0; i < itemElements.length; i++) {
      const item = itemElements[i];
      
      // Extract enclosure (image) if available
      const enclosureElements = item.getElementsByTagName('enclosure');
      let enclosure;
      
      if (enclosureElements.length > 0) {
        enclosure = {
          url: enclosureElements[0].getAttribute('url'),
          type: enclosureElements[0].getAttribute('type')
        };
      }
      
      // Extract content:encoded if available, otherwise use description
      const contentEncoded = item.getElementsByTagName('content:encoded')[0]?.textContent;
      const description = item.getElementsByTagName('description')[0]?.textContent;
      const content = contentEncoded || description || '';
      
      // Extract image from content if no enclosure
      if (!enclosure) {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch && imgMatch[1]) {
          enclosure = {
            url: imgMatch[1],
            type: 'image/jpeg' // Assume jpeg for simplicity
          };
        }
      }
      
      // Extract categories
      const categoryElements = item.getElementsByTagName('category');
      const categories = [];
      
      for (let j = 0; j < categoryElements.length; j++) {
        categories.push(categoryElements[j].textContent);
      }
      
      // Add item to items array
      items.push({
        title: item.getElementsByTagName('title')[0]?.textContent || '',
        link: item.getElementsByTagName('link')[0]?.textContent || '',
        pubDate: item.getElementsByTagName('pubDate')[0]?.textContent || '',
        content,
        contentSnippet: description,
        creator: item.getElementsByTagName('dc:creator')[0]?.textContent || 'CoinDesk',
        categories,
        enclosure
      });
    }
    
    // Return the RSS feed as JSON
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=1800' // Cache for 30 minutes
      },
      body: JSON.stringify({
        title,
        description,
        link,
        items
      })
    };
  } catch (error) {
    console.error('Error processing CoinDesk RSS feed:', error);
    
    return {
      statusCode: 200, // Return 200 for client-side error handling
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: `Failed to process CoinDesk RSS feed: ${error.message}`,
        items: [] // Include empty items array so the component can handle it
      })
    };
  }
};