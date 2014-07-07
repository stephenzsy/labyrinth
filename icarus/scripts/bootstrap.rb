#!/usr/bin/env ruby

require 'optparse'
require 'open3'
require 'fileutils'

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

end.parse!

raise "Missing argument: --app-id" unless options[:app_id]
raise "Missing argument: --app-deployment-dir" unless options[:app_dir]
raise "Missing argument: --package-url" unless options[:package_url]
raise "Missing argument: --icarus-config-path" unless options[:package_url]

stdout_str, stderr_str, status = Open3.capture3('npm', 'install', options[:package_url], :chdir => options[:app_dir])
puts stdout_str
$stderr.puts stderr_str

puts "Creating symlink ...."
app_symlink = File.join('/var/app', options[:app_id])
if (File.exists? app_symlink)
  File.delete app_symlink
end
File.symlink(File.join(options[:app_dir], 'node_modules', options[:app_id]), app_symlink)

puts "Preparing config ...."
FileUtils.ln_sf(options[:icarus_config_path], File.join(app_symlink, 'config', 'config.js'))

puts "Preparing passenger files ...."
app_temp_dir = File.join(app_symlink, 'tmp')
unless (Dir.exists? app_temp_dir)
  FileUtils.mkdir_p(app_temp_dir)
end
# write empty file
File.open(File.join(app_temp_dir, 'restart.txt'), 'w') {}




