/**
 * Scripts to check unpublished version and run publish
 */
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function publish(pkg, directory) {
    console.log('[PUBLISH]', pkg);

    execSync('npm publish --access public', {
        cwd: directory,
        encoding: 'utf-8',
        stdio: 'inherit',
    });
}

const BASE_PATH = path.join(__dirname, '../packages/@dollie');
const NPM_TOKEN = process.env.NPM_TOKEN;

if (!NPM_TOKEN) {
    console.log('No npm token found');
}

const packages = fs.readdirSync(BASE_PATH);

for (const packageName of packages) {
    const packagePathname = path.join(BASE_PATH, packageName);
    fs.writeFileSync(path.join(packagePathname, '.npmrc'), `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`);
    publish(packageName, packagePathname);
}
