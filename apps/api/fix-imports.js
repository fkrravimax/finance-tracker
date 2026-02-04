const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace local imports
    // Regex matches: from " or ' then . or .. then / then anything not ending in .js then " or '
    // We need to be careful.

    // Strategy: find all import/export ... from '...'
    content = content.replace(/from\s+['"](\..+?)['"]/g, (match, importPath) => {
        if (importPath.endsWith('.js')) return match;

        // Special case for db directory
        if (importPath.endsWith('/db')) {
            return `from '${importPath}/index.js'`;
        }

        // Default: append .js
        return `from '${importPath}.js'`;
    });

    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
