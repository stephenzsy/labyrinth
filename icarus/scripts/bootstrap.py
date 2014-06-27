#!/usr/bin/env python3.4

import argparse
import os
import urllib3

parser = argparse.ArgumentParser(description='Bootstrap')

parser.add_argument('--package-landing-dir', metavar='directory',
                    required=True, help='Package landing directory')
parser.add_argument('--package-url', metavar='URL', required=True, help='Package URL')
parser.add_argument('--package-filename', metavar='filename', required=True,
                    help='Package Filename')

args = parser.parse_args()
print(args)

# make landing directory and download the file from s3
os.makedirs(args.package_landing_dir, 0o755, exist_ok=True)

package_file_path = os.path.join(args.package_landing_dir, args.package_filename)

http = urllib3.PoolManager()
with  http.request('GET', args.package_url) as r:
    with open(package_file_path, 'wb') as out:
        out.write(r.data)
        out.close()
    r.release_conn()

