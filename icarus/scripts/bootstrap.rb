#!/usr/bin/env ruby

require 'optparse'
require 'open3'
require 'fileutils'
require 'openssl'

options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: bootstrap.rb [options]"

  opts.on("--app-id APPID", "Application ID") do |v|
    options[:app_id] = v;
  end

  opts.on("--app-deployment-dir DIRECTORY", "Application actual deployment director") do |v|
    options[:app_dir] = v
  end

  opts.on('--package-url URL', "Application package URL") do |v|
    options[:package_url] = v
  end

  opts.on('--icarus-config-path PATH', "Icarus Config URL") do |v|
    options[:icarus_config_path] = v
  end

  opts.on('--nginx-config-path PATH', "Nginx Config URL") do |v|
    options[:nginx_config_path] = v
  end

  opts.on('--cert-subject SUBJECT', "Certificate Subject") do |v|
    options[:cert_subject] = v
  end

end.parse!

raise "Missing argument: --app-id" unless options[:app_id]
raise "Missing argument: --app-deployment-dir" unless options[:app_dir]
raise "Missing argument: --package-url" unless options[:package_url]
raise "Missing argument: --icarus-config-path" unless options[:package_url]
raise "Missing argument: --nginx-config-path" unless options[:package_url]
raise "Missing argument: --cert-subject" unless options[:cert_subject]

stdout_str, stderr_str, status = Open3.capture3('npm', 'install', options[:package_url], :chdir => options[:app_dir])
puts stdout_str
$stderr.puts stderr_str

puts "Initialize keys"
keys_dir = File.join('/var/app', '.keys')
FileUtils.mkdir_p keys_dir unless Dir.exists? keys_dir

key = OpenSSL::PKey::RSA.new 2048
File.open(File.join(keys_dir, 'private_key.pem'), 'w') do |io|
  io.write key.to_pem
end
File.open(File.join(keys_dir, 'public_key.pem'), 'w') do |io|
  io.write key.public_key.to_pem
end
begin
  csr = OpenSSL::X509::Request.new
  csr.version = 0
  csr.subject = OpenSSL::X509::Name.parse options[:cert_subject]
  csr.public_key = key.public_key
  csr.sign key, OpenSSL::Digest::SHA256.new
  File.open(File.join(keys_dir, 'csr.pem'), 'w') do |io|
    io.write csr.to_pem
  end

  dh = OpenSSL::PKey::DH.new 1024
  File.open(File.join(keys_dir, 'dhparam.pem'), 'w') do |io|
    io.write(dh.to_pem)
  end
end

puts "Creating symlink ...."
app_symlink = File.join('/var/app', options[:app_id])
if (File.exists? app_symlink)
  File.delete app_symlink
end
File.symlink(File.join(options[:app_dir], 'node_modules', options[:app_id]), app_symlink)

puts "Preparing config ...."
FileUtils.ln_sf(options[:icarus_config_path], File.join(app_symlink, 'config', 'config.js'))

puts "Preparing nginx config"
FileUtils.ln_sf(options[:nginx_config_path], File.join('/opt/nginx/conf', 'nginx.conf'))
if (File.exists? '/opt/nginx/html/index.html')
  File.delete '/opt/nginx/html/index.html'
end

puts "Preparing passenger files ...."
app_temp_dir = File.join(app_symlink, 'tmp')
unless (Dir.exists? app_temp_dir)
  FileUtils.mkdir_p(app_temp_dir)
end
# write empty file
File.open(File.join(app_temp_dir, 'restart.txt'), 'w') {}




