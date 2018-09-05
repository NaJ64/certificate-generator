# Certificate Generator 
A Certificate Authority using OpenSSL and Node.js

## Obtaining OpenSSL:

1.  Download a precompiled build/installer of OpenSSL

    [**`Win64OpenSSL-1_1_0f.exe`**](https://slproweb.com/products/Win32OpenSSL.html ) 

2.  Install to the following folder:
    ```
    C:\OpenSSL-Win64\bin\
    ```
    > *Make sure to add the executable location to system PATH variable so `openssl` can be run via command line*

## Generating the Certificate Authority (CA)

1.  Create root folder **`/my-ca/`**:

2.  Create subfolder **`/my-ca/signed-certificates/`** for output certificates

3.  Create file **`/my-ca/serial`** (no file extension) with contents:
    ```
    01
    ```

4.  Create **`/my-ca/index.txt`** file 
    > *This file is intentionally left empty*

5.  Create **`/my-ca/my-ca.cnf`** file with contents:
    ```
    [ ca ]
    default_ca      = local_ca
    #
    #
    # Default location of directories and files needed to generate certificates.
    #
    [ local_ca ]
    dir             = .
    certificate     = $dir\\my-ca-certificate.pem
    database        = $dir\\index.txt
    new_certs_dir   = $dir\\signed-certificates
    private_key     = $dir\\my-ca-private-key.pem
    serial          = $dir\\serial
    #
    #
    # Default expiration and encryption policies for certificates.
    #
    default_crl_days        = 365
    default_days            = 1825
    default_md              = sha256
    #
    policy          = local_ca_policy
    x509_extensions = local_ca_extensions
    #
    #
    # Copy extensions specified in the certificate request
    #
    copy_extensions = copy
    #
    #
    # Default policy to use when generating server certificates.  The following
    # fields must be defined in the server certificate.
    #
    [ local_ca_policy ]
    commonName              = supplied
    stateOrProvinceName     = supplied
    countryName             = supplied
    emailAddress            = supplied
    organizationName        = supplied
    organizationalUnitName  = supplied
    #
    #
    # x509 extensions to use when generating server certificates.
    #
    [ local_ca_extensions ]
    basicConstraints        = CA:false
    #
    #
    # The default root certificate generation policy.
    #
    [ req ]
    default_bits    = 2048
    default_keyfile = my-ca-private-key.pem
    default_md      = sha256
    #
    prompt                  = no
    distinguished_name      = root_ca_distinguished_name
    x509_extensions         = root_ca_extensions
    #
    #
    # Root Certificate Authority distinguished name.  Change these fields to match
    # your local environment!
    #
    [ root_ca_distinguished_name ]
    commonName              = My CA
    stateOrProvinceName     = Louisiana
    countryName             = US
    emailAddress            = MyDepartment@myorganization.com
    organizationName        = My Organization
    organizationalUnitName  = My Department
    #
    [ root_ca_extensions ]
    basicConstraints        = CA:true
    ```

6. Create the CA self-signed certificate and private key using the *Certificate Request and Generating Utility* in OpenSSL

    -   Run the following command from root folder **`\my-ca\`**:
        ```
        openssl req -x509 -out my-ca-certificate.pem -newkey rsa:2048 -keyout my-ca-private-key.pem -days 1825 -config my-ca.cnf
        ```
        > *Specifying `-x509` indicates a self-signing certificate*

        > *Specifying `-days 1825` means the certificate is valid for 5 years*

    -   Select a password for `my-ca-private-key.pem` private key file and answer the prompts

    -   Verify the certificate with the following command inside the CA folder
        ```
        openssl x509 -in my-ca-certificate.pem -text
        ```

## Adding the CA root certificate as a "trusted" authority on the client system

1.  Open Google Chrome and go to:

    `Settings` -> `Advanced` -> `Manage Certificates`

2.  Select tab `Trusted Root Certification Authorities`

3.  Import the `my-ca-certificate.pem` file 
    > *You may have to select **Show all files** if the **`.pem`** extension doesn't show up*
    
4.  Select option *`Place all certificates in the following store`* 

5.  Select option *`Trusted Root Certification Authorities`*

## Generating a new certificate

1.  Open file **`.vscode/tasks.json`** in **Visual Studio Code** and edit the **`args`** property for task **`generate-new-certificate`**:

    Example for "**`appserver`**":
    ```
    "args": [
        "abcSEP)00",        // CA Password
        "appserver",        // New Certificate name
        "appserver",        // New Certificate Server Name
        "192.168.0.1",      // New Certificate Server IP
        "appAUG!01"         // New Certificate Password
    ]
    ```

2.  Run task **`generate-new-certificate`** using **Visual Studio Code** 
    > *This will create a "certificate signing request" in a new folder which is used to generate `.pem` certificate & private key files.  The resulting `.pem` files will also be bundled into a `.pfx` file by the task*

3.  The generated certificate files can be found in the **`/certificates/`** directory in the root of the project
