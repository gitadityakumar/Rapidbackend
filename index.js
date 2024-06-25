(async () => {
  const fs = require('fs-extra');
  const path = require('path');
  const { execa } = await import('execa');
  const inquirer = await import('inquirer');

  async function init() {
      // Get project details from user
      const { projectName, typescript } = await inquirer.default.prompt([
          { name: 'projectName', message: 'Project name?', default: 'my-backend-app' },
          { type: 'confirm', name: 'typescript', message: 'Use TypeScript?', default: false }
      ]);

      // Create project directory and initialize npm
      const projectPath = path.resolve(process.cwd(), projectName);
      await fs.mkdir(projectPath);
      process.chdir(projectPath);
      await execa('npm', ['init', '-y']);

      // Initialize TypeScript if selected
      if (typescript) {
          await execa('npx', ['tsc', '--init']);
          const tsConfig = await fs.readFile(path.join(projectPath, 'tsconfig.json'), 'utf8');
          const updatedTsConfig = tsConfig.replace(/\/\/\s*"rootDir": "\.\/",/g, '"rootDir": "./src",')
                                          .replace(/\/\/\s*"outDir": "\.\/",/g, '"outDir": "./dist",');
          await fs.writeFile(path.join(projectPath, 'tsconfig.json'), updatedTsConfig);
          await fs.mkdir(path.join(projectPath, 'src'));
          await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), '// Starter code for TypeScript\n');
          // Add TypeScript and other dependencies to package.json
          const packageJsonPath = path.join(projectPath, 'package.json');
          const packageJson = await fs.readJson(packageJsonPath);
          packageJson.dependencies = {
              ...packageJson.dependencies,
              "express": "latest"
          };
          packageJson.devDependencies = {
              ...packageJson.devDependencies,
              "@types/express": "latest",
              "typescript": "latest",
              "ts-node": "latest",
              "nodemon": "latest",
              "dotenv": "latest"
          };
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      } else {
          await fs.mkdir(path.join(projectPath, 'src'));
          await fs.writeFile(path.join(projectPath, 'src', 'index.js'), '// Starter code for JavaScript\n');
          
          // Add express dependency
          const packageJsonPath = path.join(projectPath, 'package.json');
          const packageJson = await fs.readJson(packageJsonPath);
          packageJson.dependencies = {
              "express": "latest",
              
          };
          packageJson.devDependencies = {
              ...packageJson.devDependencies,
              "nodemon": "latest",
             
          };
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      }

      // Create .gitignore, .env, and .env.sample
      const gitignoreContent = `
node_modules/
.env
`;
      await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent.trim());

      const envContent = `PORT=3000\n`;
      const envSampleContent = `PORT=`;
      await fs.writeFile(path.join(projectPath, '.env'), envContent);
      await fs.writeFile(path.join(projectPath, '.env.sample'), envSampleContent);

      // Create starter code for Express server
      const expressCode = `
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`;
      const expressTsCode = `
import express, { Request, Response } from 'express';
import { config } from 'dotenv';

config();

const app = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`;
      if (typescript) {
          await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), expressTsCode.trim());
      } else {
          await fs.writeFile(path.join(projectPath, 'src', 'index.js'), expressCode.trim());
      }

      // Update package.json scripts
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.scripts = typescript
          ? {
              "build": "tsc -b",
              "dev": "tsc -b && node ./dist/index.js",
              "watch": "nodemon --exec ts-node ./src/index.ts",
              "start": "tsc -b && node ./dist/index.js"
          }
          : {
              "dev": "node ./src/index.js",
              "watch": "nodemon ./src/index.js",
              "start": "node ./src/index.js"
          };
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      
      console.log(`Project ${projectName} created successfully!`);
      console.log(` Now run cd ${projectName}\n npm install `);
  }

  init().catch(err => {
      console.error(err);
      process.exit(1);
  });
})();
