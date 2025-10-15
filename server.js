const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so frontend hosted anywhere can call backend)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve hosted projects
app.use(express.static(path.join(__dirname, "sites")));

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
    const projectDir = path.join(__dirname, "sites", projectName);
    
    // Create project folder if not exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    cb(null, projectDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but sanitize it
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /html|css|js|txt|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only web files (HTML, CSS, JS, images, fonts) are allowed'));
    }
  }
});

// Custom middleware to handle missing index files
app.use((req, res, next) => {
  const pathParts = req.path.split('/').filter(part => part !== '');
  
  if (pathParts.length > 0) {
    const requestedProject = pathParts[0];
    const projectPath = path.join(__dirname, "sites", requestedProject);
    
    if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
      const indexPath = path.join(projectPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        // Project exists but no index.html - show custom error page
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Missing Index File - Codewave Web Hosting</title>
            <style>
              :root {
                --primary: #6366f1;
                --primary-dark: #4f46e5;
                --secondary: #1e293b;
                --light: #f8fafc;
                --dark: #0f172a;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
              }
              
              .container {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 600px;
                width: 100%;
              }
              
              h1 {
                font-size: 2.5rem;
                margin-bottom: 20px;
                color: white;
              }
              
              p {
                margin-bottom: 25px;
                font-size: 1.1rem;
                line-height: 1.6;
                opacity: 0.9;
              }
              
              .icon {
                font-size: 4rem;
                margin-bottom: 25px;
                color: rgba(255, 255, 255, 0.8);
              }
              
              .project-name {
                background: rgba(255, 255, 255, 0.15);
                padding: 10px 20px;
                border-radius: 8px;
                display: inline-block;
                margin: 15px 0;
                font-weight: 500;
              }
              
              .actions {
                margin-top: 30px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                align-items: center;
              }
              
              .btn {
                padding: 12px 25px;
                border-radius: 8px;
                border: none;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
                font-size: 1rem;
              }
              
              .btn-primary {
                background: white;
                color: var(--primary);
              }
              
              .btn-primary:hover {
                background: #f1f5f9;
                transform: translateY(-2px);
              }
              
              .btn-secondary {
                background: transparent;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
              }
              
              .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              
              .credit {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 0.9rem;
                opacity: 0.7;
              }
              
              @media (max-width: 600px) {
                .container {
                  padding: 30px 20px;
                }
                
                h1 {
                  font-size: 2rem;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              
              <h1>Missing Index File</h1>
              
              <p>The project <span class="project-name">${requestedProject}</span> exists but doesn't contain an <code>index.html</code> file.</p>
              
              <p>Please make sure your project has an <code>index.html</code> file as the main entry point.</p>
              
              <div class="actions">
                <a href="/" class="btn btn-primary">
                  <i class="fas fa-home"></i> Return to Home
                </a>
                
                <a href="/upload.html" class="btn btn-secondary">
                  <i class="fas fa-cloud-upload-alt"></i> Upload a New Project
                </a>
              </div>
              
              <div class="credit">
                <p>Developed by Iconic Tech • Protected by SilentByte Security System</p>
              </div>
            </div>
            
            <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
          </body>
          </html>
        `);
      }
    }
  }
  
  next();
});

// API route to get user's projects
app.get("/api/projects", (req, res) => {
  try {
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to read projects" });
  }
});

// API route to save project info
app.post("/api/projects", (req, res) => {
  try {
    const { name, url, date, files } = req.body;
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    const existingIndex = projects.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      projects[existingIndex] = { name, url, date, files };
    } else {
      projects.push({ name, url, date, files });
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
    res.json({ success: true, message: "Project saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save project" });
  }
});

// API route to delete a project
app.delete("/api/projects/:name", (req, res) => {
  try {
    const projectName = req.params.name;
    const dbPath = path.join(dbDir, "projects.json");
    
    if (fs.existsSync(dbPath)) {
      let projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      projects = projects.filter(p => p.name !== projectName);
      fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
    }
    
    const projectDir = path.join(__dirname, "sites", projectName);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Upload route - handle multiple files
app.post("/upload", upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0 || !req.body.project) {
    return res.status(400).send("⚠️ Please provide both files and a project name!");
  }

  const projectName = req.body.project.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
  const projectUrl = `${req.protocol}://${req.get("host")}/${projectName}`;
  
  // Save project info to database
  try {
    const dbPath = path.join(dbDir, "projects.json");
    let projects = [];
    
    if (fs.existsSync(dbPath)) {
      projects = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
    
    const existingIndex = projects.findIndex(p => p.name === projectName);
    const fileList = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      uploaded: new Date().toISOString()
    }));
    
    const projectData = {
      name: projectName,
      url: projectUrl,
      date: new Date().toISOString(),
      files: fileList
    };
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectData;
    } else {
      projects.push(projectData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error("Error saving project info:", error);
  }

  res.send(`
    <div style="font-family: 'Poppins', sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #4CAF50; margin-bottom: 15px;">✅ Website Hosted Successfully!</h2>
      <p style="margin-bottom: 10px;">Your project: <b style="color: #6366f1;">${projectName}</b></p>
      <p style="margin-bottom: 10px;">Files uploaded: <b>${req.files.length}</b></p>
      <p style="margin-bottom: 15px;">View it here:</p>
      <a href="${projectUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Open Website
      </a>
      <br><br>
      <small style="color: #64748b;">Developed by Iconic Tech • Protected by SilentByte Security System</small>
    </div>
  `);
});

// API endpoint to get file list for editing
app.get("/api/project/:name/files", (req, res) => {
  try {
    const projectName = req.params.name;
    const projectDir = path.join(__dirname, "sites", projectName);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const files = fs.readdirSync(projectDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      };
    });
    
    res.json(fileDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to read project files" });
  }
});

// API endpoint to get file content for editing
app.get("/api/project/:name/file/:filename", (req, res) => {
  try {
    const projectName = req.params.name;
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "sites", projectName, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const content = fs.readFileSync(filePath, "utf8");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

// API endpoint to update file content
app.put("/api/project/:name/file/:filename", (req, res) => {
  try {
    const projectName = req.params.name;
    const filename = req.params.filename;
    const { content } = req.body;
    const filePath = path.join(__dirname, "sites", projectName, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    fs.writeFileSync(filePath, content, "utf8");
    res.json({ success: true, message: "File updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update file" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).send('Too many files uploaded. Maximum is 20.');
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('File too large. Maximum size is 10MB.');
    }
  }
  
  res.status(500).send(error.message);
});

// Root
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🌐 Codewave Web Hosting</title>
      <style>
        body { 
          font-family: 'Poppins', sans-serif; 
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 30px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { margin-bottom: 10px; }
        p { margin-bottom: 20px; opacity: 0.9; }
        a { 
          color: white; 
          text-decoration: none;
          font-weight: 500;
          border: 1px solid white;
          padding: 10px 20px;
          border-radius: 6px;
          display: inline-block;
          transition: all 0.3s ease;
        }
        a:hover {
          background: white;
          color: #6366f1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Codewave Web Hosting</h1>
        <p>Free hosting for your web projects</p>
        <p>Developed by Iconic Tech • Protected by SilentByte Security System</p>
        <a href="/upload.html">Go to Upload Interface</a>
      </div>
    </body>
    </html>
  `);
});

// Handle 404 errors for non-existent projects
app.use((req, res) => {
  const pathParts = req.path.split('/').filter(part => part !== '');
  
  if (pathParts.length > 0) {
    const requestedProject = pathParts[0];
    const projectPath = path.join(__dirname, "sites", requestedProject);
    
    if (!fs.existsSync(projectPath)) {
      // Project doesn't exist
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Not Found - Codewave Web Hosting</title>
          <style>
            /* Same styles as the missing index page, but with different content */
            :root {
              --primary: #6366f1;
              --primary-dark: #4f46e5;
              --secondary: #1e293b;
              --light: #f8fafc;
              --dark: #0f172a;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Poppins', sans-serif;
              background: linear-gradient(135deg, var(--primary), var(--primary-dark));
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              max-width: 600px;
              width: 100%;
            }
            
            h1 {
              font-size: 2.5rem;
              margin-bottom: 20px;
              color: white;
            }
            
            p {
              margin-bottom: 25px;
              font-size: 1.1rem;
              line-height: 1.6;
              opacity: 0.9;
            }
            
            .icon {
              font-size: 4rem;
              margin-bottom: 25px;
              color: rgba(255, 255, 255, 0.8);
            }
            
            .project-name {
              background: rgba(255, 255, 255, 0.15);
              padding: 10px 20px;
              border-radius: 8px;
              display: inline-block;
              margin: 15px 0;
              font-weight: 500;
            }
            
            .actions {
              margin-top: 30px;
              display: flex;
              flex-direction: column;
              gap: 15px;
              align-items: center;
            }
            
            .btn {
              padding: 12px 25px;
              border-radius: 8px;
              border: none;
              font-weight: 500;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              transition: all 0.3s ease;
              font-size: 1rem;
            }
            
            .btn-primary {
              background: white;
              color: var(--primary);
            }
            
            .btn-primary:hover {
              background: #f1f5f9;
              transform: translateY(-2px);
            }
            
            .btn-secondary {
              background: transparent;
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .btn-secondary:hover {
              background: rgba(255, 255, 255, 0.1);
            }
            
            .credit {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              font-size: 0.9rem;
              opacity: 0.7;
            }
            
            @media (max-width: 600px) {
              .container {
                padding: 30px 20px;
              }
              
              h1 {
                font-size: 2rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <i class="fas fa-search"></i>
            </div>
            
            <h1>Project Not Found</h1>
            
            <p>The project <span class="project-name">${requestedProject}</span> doesn't exist or may have been deleted.</p>
            
            <p>Please check the project name or upload it again using our upload interface.</p>
            
            <div class="actions">
              <a href="/" class="btn btn-primary">
                <i class="fas fa-home"></i> Return to Home
              </a>
              
              <a href="/upload.html" class="btn btn-secondary">
                <i class="fas fa-cloud-upload-alt"></i> Upload a New Project
              </a>
            </div>
            
            <div class="credit">
              <p>Developed by Iconic Tech • Protected by SilentByte Security System</p>
            </div>
          </div>
          
          <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
        </body>
        </html>
      `);
    }
  }
  
  // Generic 404 for other paths
  res.status(404).send(`
    <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
      <h1 style="color: #6366f1;">404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
        Return to Home
      </a>
    </div>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Codewave Web Hosting running at http://localhost:${PORT}`);
  console.log(`📁 Serving sites from: ${path.join(__dirname, "sites")}`);
  console.log(`💾 Database location: ${path.join(__dirname, "database")}`);
  console.log(`🔒 Protected by SilentByte Security System`);
  console.log(`👨‍💻 Developed by Iconic Tech`);
});