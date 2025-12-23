#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import { updateFiles } from './update-header.js';

// __dirname is not available in ES modules, so we create it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function install() {
  console.log(chalk.green('Running auto-header-author installer...'));

  const projectRoot = process.cwd();
  const templatesDir = path.join(__dirname, 'templates');

  const globalConfigName = 'auto-header.config.json';
  const localConfigName = '.auto-header-local.json';

  try {
    // 1. Copy configuration files
    console.log(chalk.blue('1/5 - Copying configuration files...'));
    await fs.copy(path.join(templatesDir, globalConfigName), path.join(projectRoot, globalConfigName));
    await fs.copy(path.join(templatesDir, localConfigName), path.join(projectRoot, localConfigName));
    console.log(chalk.green('  ✓ Configuration files copied.'));

    // 2. Add local config to .gitignore
    console.log(chalk.blue('2/5 - Updating .gitignore...'));
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const ignoreEntry = '.auto-header-local.json';

    try {
        let gitignoreContent = '';
        if (await fs.pathExists(gitignorePath)) {
            gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        }

        if (!gitignoreContent.includes(ignoreEntry)) {
            await fs.appendFile(gitignorePath, `\n# Auto Header Author config\n${ignoreEntry}\n`);
        }
        const nodeModulesEntry = 'node_modules/';
        if (!gitignoreContent.includes(nodeModulesEntry)) {
            await fs.appendFile(gitignorePath, `\n# Node.js modules\n${nodeModulesEntry}\n`);
        }
        console.log(chalk.green('  ✓ .gitignore updated.'));
    } catch (error) {
        console.warn(chalk.yellow(`  - Could not update .gitignore. Please add "${ignoreEntry}" manually.`));
    }

    // 3. Install dev dependencies
    console.log(chalk.blue('3/5 - Installing dev dependencies (husky, lint-staged)...'));
    try {
        await execa('npm', ['install', 'husky', 'lint-staged', '--save-dev'], { cwd: projectRoot });
        console.log(chalk.green('  ✓ Dependencies installed.'));
    } catch (error) {
        console.error(chalk.red('  ✗ Failed to install dependencies.'), error);
        throw error; // Stop installation if dependencies fail
    }

    // 4. Configure lint-staged
    console.log(chalk.blue('4/5 - Configuring lint-staged...'));
    const pkgPath = path.join(projectRoot, 'package.json');
    try {
        const pkg = await fs.readJson(pkgPath);
        pkg['lint-staged'] = {
            '*': 'auto-header-author run',
        };
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
        console.log(chalk.green('  ✓ lint-staged configured in package.json.'));
    } catch (error) {
        console.error(chalk.red('  ✗ Failed to configure lint-staged in package.json.'), error);
        throw error;
    }

    // 5. Configure husky
    console.log(chalk.blue('5/5 - Configuring husky pre-commit hook...'));
    try {
        // Enable husky
        await execa('npm', ['pkg', 'set', 'scripts.prepare=husky'], { cwd: projectRoot });
        await execa('npm', ['run', 'prepare'], { cwd: projectRoot });
        
        // Create pre-commit hook
        const hookPath = path.join(projectRoot, '.husky', 'pre-commit');
        const hookScript = 'npx lint-staged';
        await fs.writeFile(hookPath, hookScript);
        await fs.chmod(hookPath, '755'); // Make it executable
        
        console.log(chalk.green('  ✓ Husky pre-commit hook created.'));
    } catch (error) {
        console.error(chalk.red('  ✗ Failed to configure husky.'), error);
        console.log(chalk.yellow('  Please try running "npx husky init" and creating the .husky/pre-commit file manually.'));
        throw error;
    }

    console.log(chalk.green.bold('\n🚀 auto-header-author installation complete!'));
    console.log(chalk.white('  - Configuration files have been created.'));
    console.log(chalk.yellow(`  - IMPORTANT: Edit '.auto-header-local.json' with your name and email.`));
    console.log(chalk.white('  - The pre-commit hook is set up. Headers will be updated automatically on commit.'));

  } catch (error) {
    console.error(chalk.red('\n❌ Installation failed. Please check the errors above.'));
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .command('install', 'Installs and configures auto-header in the current project', install)
  .command('run [files...]', 'Process files to update headers (used by lint-staged)', (yargs) => {
    yargs.positional('files', {
      describe: 'A list of files to process',
      type: 'string',
    });
  }, async (argv) => {
    if (argv.files && argv.files.length > 0) {
      await updateFiles(argv.files);
    } else {
      console.log(chalk.yellow('The \'run\' command requires file paths to be specified.'));
    }
  })
  .demandCommand(1, 'You must specify a command (e.g., \'install\' or \'run\').')
  .help()
  .argv;