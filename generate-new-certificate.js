// Get built-in node libraries
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// Define a recursive delete function
const rmdirSyncRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                rmdirSyncRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

// Options needed to create certs
var caPassword = undefined;
var certName = undefined;
var serverName = undefined;
var serverIp = undefined;
var password = undefined;

// Get options from command args
const [, , ...args] = process.argv;
if (!!args[0]) {
    caPassword = args[0];
}
if (!!args[1]) {
    certName = args[1];
}
if (!!args[2]) {
    serverName = args[2];
}
if (!!args[3]) {
    serverIp = args[3];
}
if (!!args[4]) {
    password = args[4];
}

// Verify all args were provided
if (typeof certName == 'undefined' ||
    typeof serverName == 'undefined' ||
    typeof serverIp == 'undefined') {
    return console.error('Server Name, Server IP, and Private Key must be provided as args')
}

// Create certificates master directory (should only be done once)
const certificatesDir = path.resolve('./certificates');
if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir);
}

// Create subfolder for the new cert
const certificateFiles = path.resolve(certificatesDir, certName);
if (fs.existsSync(certificateFiles)) {
    rmdirSyncRecursive(certificateFiles);
}
fs.mkdirSync(certificateFiles);

// Derive file names
const caRoot = path.resolve('./my-ca');
const caConfigFile = path.resolve(caRoot, 'my-ca.cnf');
const certConfigFile = path.resolve(certificateFiles, `${certName}.cnf`);
const certCsrFileName = `${certName}-csr.pem`;
const certCsrFile = path.resolve(certificateFiles, certCsrFileName);
const certPrivateKeyFileName = `${certName}-private-key.pem`;
const certFileName = path.resolve(certificateFiles, `${certName}-certificate.pem`);
const certPfxFileName = `${certName}.pfx`;

// Config template
const certConfigTemplate = `[ req ]
prompt                  = no
distinguished_name      = server_distinguished_name
req_extensions          = v3_req

[ server_distinguished_name ]
commonName              = ${serverName.toUpperCase()}
stateOrProvinceName     = Louisiana
countryName             = US
emailAddress            = MyDepartment@myorganization.com
organizationName        = My Organization
organizationalUnitName  = My Department

[ v3_req ]
basicConstraints        = CA:FALSE
keyUsage                = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName		    = @alt_names

[ alt_names ]
DNS			= ${serverName.toLowerCase()}
IP 			= ${serverIp}`;

// Create the config file
console.log(`Creating config file: \n\n  ${certConfigFile}`);
fs.writeFileSync(certConfigFile, certConfigTemplate);

// Create the CSR file with openssl "req" utility/command
const createCsrCommand = `openssl req -config ${certConfigFile} -out ${certCsrFileName} -newkey rsa:2048 -keyout ${certPrivateKeyFileName} -passin pass:${password} -passout pass:${password}`;
const createCsrOptions = { cwd: path.resolve(certificateFiles) };
console.log('\nChanged working directory --> ' + path.resolve(certificateFiles));
console.log('\nGenerating CSR / Private Key: \n\n>  ' + createCsrCommand);
child_process.execSync(createCsrCommand, createCsrOptions);

// Sign the CSR and output the certificate files with openssl "ca" utility/command
const relativeCertOutput = path.resolve('../', certName, certFileName);
const createCertCommand = `openssl ca -config ${caConfigFile} -in ${certCsrFile} -out ${relativeCertOutput} -passin pass:${caPassword} -batch`;
const createCertOptions = { cwd: caRoot };
console.log('\nChanged working directory --> ' + caRoot);
console.log('\nCreating Certificate: \n\n>  ' + createCertCommand);
child_process.execSync(createCertCommand, createCertOptions);

// Bundle certificate/private-key into a PFX file with openssl "pksc12" utility/command:
const bundlePfxCommand = `openssl pkcs12 -export -in ${certFileName} -inkey ${certPrivateKeyFileName} -out ${certPfxFileName} -passin pass:${password} -passout pass:${password}`;
const bundlePfxOptions = { cwd: path.resolve(certificateFiles) };
console.log('\nChanged working directory --> ' + path.resolve(certificateFiles));
console.log('\nBundling Certificate / Private Key into PFX: \n\n>  ' + bundlePfxCommand);
child_process.execSync(bundlePfxCommand, bundlePfxOptions);

// Finished
console.log('\nFinished creating files in directory: \n\n  ' + certificateFiles);