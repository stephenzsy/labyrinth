#!/usr/bin/env ruby

require 'open3'
require 'openssl'
require 'optparse'

options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: sign_certificate.rb [options]"

  opts.on('--csr-content CONTENT', 'CSR content') do |v|
    options[:csr_content] = v
  end

  opts.on('--ca-cert-path PATH', 'CA Cert Path') do |v|
    options[:ca_cert_path] = v
  end

  opts.on('--ca-key-path PATH', 'CA Key Path') do |v|
    options[:ca_key_path] = v
  end
end.parse!

raise "Missing argument: --csr-content" unless options[:csr_content]
raise "Missing argument: --ca-cert-path" unless options[:ca_cert_path]
raise "Missing argument: --ca-key-path" unless options[:ca_key_path]

csr = OpenSSL::X509::Request.new(options[:csr_content])
raise 'CSR can not be verified' unless csr.verify csr.public_key

ca_cert = OpenSSL::X509::Certificate.new File.read(options[:ca_cert_path])
ca_key = OpenSSL::PKey::RSA.new File.read(options[:ca_key_path])

csr_cert = OpenSSL::X509::Certificate.new
csr_cert.serial = 0
csr_cert.version = 2
csr_cert.not_before = Time.now
csr_cert.not_after = Time.now + 86400 * 180

csr_cert.subject = csr.subject
csr_cert.public_key = csr.public_key
csr_cert.issuer = ca_cert.subject

extension_factory = OpenSSL::X509::ExtensionFactory.new
extension_factory.subject_certificate = csr_cert
extension_factory.issuer_certificate = ca_cert

csr_cert.add_extension extension_factory.create_extension('basicConstraints', 'CA:FALSE')

csr_cert.add_extension extension_factory.create_extension(
                           'keyUsage', 'keyEncipherment,dataEncipherment,digitalSignature')

csr_cert.add_extension extension_factory.create_extension('subjectKeyIdentifier', 'hash')

csr_cert.sign ca_key, OpenSSL::Digest::SHA256.new

puts csr_cert.to_pem