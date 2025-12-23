import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';

const HEADER_START_MARKER = '@auto-header-start';
const HEADER_END_MARKER = '@auto-header-end';

async function loadConfigs(projectRoot) {
    const globalConfigPath = path.join(projectRoot, 'auto-header.config.json');
    const localConfigPath = path.join(projectRoot, '.auto-header-local.json');

    const globalConfig = await fs.readJson(globalConfigPath);
    const localConfig = await fs.readJson(localConfigPath);

    return { globalConfig, localConfig };
}

async function getCreationDate(filePath) {
    try {
        const { stdout } = await execa(
            'git',
            ['log', '--follow', '--format=%aI', '--', path.basename(filePath)],
            { cwd: path.dirname(filePath) }
        );

        const dates = stdout.split('\n').filter(Boolean);
        return dates.length
            ? dates[dates.length - 1]
            : new Date().toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function buildHeader(commentStyle, author, email, created, lastModified) {
    const createdDate = new Date(created).toISOString();
    const lastModifiedDate = new Date(lastModified).toISOString();

    if (commentStyle.type === 'block') {
        return [
            commentStyle.start,
            `${commentStyle.line} ${HEADER_START_MARKER}`,
            `${commentStyle.line} Author:         ${author} <${email}>`,
            `${commentStyle.line} Created:        ${createdDate}`,
            `${commentStyle.line} Last Modified:  ${lastModifiedDate}`,
            `${commentStyle.line} ${HEADER_END_MARKER}`,
            commentStyle.end
        ].join('\n');
    }

    return [
        `${commentStyle.start} ${HEADER_START_MARKER}`,
        `${commentStyle.start} Author:         ${author} <${email}>`,
        `${commentStyle.start} Created:        ${createdDate}`,
        `${commentStyle.start} Last Modified:  ${lastModifiedDate}`,
        `${commentStyle.start} ${HEADER_END_MARKER}`
    ].join('\n');
}

function buildHeaderRegex(commentStyle) {
    if (commentStyle.type === 'block') {
        return new RegExp(
            `${commentStyle.start}[\\s\\S]*?${HEADER_END_MARKER}[\\s\\S]*?${commentStyle.end}\\n?`,
            'm'
        );
    }

    return new RegExp(
        `${commentStyle.start}\\s+${HEADER_START_MARKER}[\\s\\S]*?${commentStyle.start}\\s+${HEADER_END_MARKER}\\n?`,
        'm'
    );
}

function extractCreatedDate(headerBlock) {
    const match = headerBlock.match(/Created:\s*(.+)/);
    return match ? new Date(match[1]).toISOString() : null;
}

function normalizeAfterHeader(content) {
    return content
        .replace(/^\s+/, '')
        .replace(/^\n+/, '');
}

export async function updateFiles(files) {
    console.log(chalk.blue('Auto Header: Processing staged files...'));

    const projectRoot = process.cwd();
    const { globalConfig, localConfig } = await loadConfigs(projectRoot);
    const { author, email } = localConfig;

    if (!author || !email) {
        console.error(chalk.red('Author name or email not configured.'));
        process.exit(1);
    }

    for (const file of files) {
        const absolutePath = path.resolve(projectRoot, file);
        if (!await fs.pathExists(absolutePath)) continue;

        const extension = path.extname(absolutePath);
        if (!globalConfig.extensions.includes(extension)) continue;

        const commentStyle = globalConfig.commentStyle[extension];
        if (!commentStyle) continue;

        const originalContent = await fs.readFile(absolutePath, 'utf8');
        let content = originalContent;

        const headerRegex = buildHeaderRegex(commentStyle);
        const headerMatch = content.match(headerRegex);

        let createdDate;

        if (headerMatch) {
            createdDate =
                extractCreatedDate(headerMatch[0]) ??
                await getCreationDate(absolutePath);
        } else {
            createdDate = await getCreationDate(absolutePath);
        }

        const lastModified = new Date().toISOString();
        const newHeader = buildHeader(
            commentStyle,
            author,
            email,
            createdDate,
            lastModified
        );

        if (headerMatch) {
            content = content.replace(headerRegex, newHeader);
            content = newHeader + '\n\n' + normalizeAfterHeader(
                content.replace(headerRegex, '')
            );
        } else {
            content = newHeader + '\n\n' + normalizeAfterHeader(content);
        }


        if (content !== originalContent) {
            await fs.writeFile(absolutePath, content, 'utf8');
            console.log(chalk.green(`  ✓ Updated: ${file}`));
        }
    }

    console.log(chalk.green('✓ Auto-header finished.'));
}
