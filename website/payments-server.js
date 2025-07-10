const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log('Request for:', req.url);
  
  if (req.url === '/payments.html' || req.url === '/payments') {
    const filePath = path.join(__dirname, 'public', 'payments.html');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Payments server running on http://localhost:${PORT}`);
}); 