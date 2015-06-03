require 'faye'
require_relative 'serverauth'
Faye::WebSocket.load_adapter('thin')

server_auth_extension = ServerAuth.new
use Faye::RackAdapter, :mount => '/faye' do |bayeux|
  bayeux.add_extension server_auth_extension
end

use Rack::Static,
  :urls => ["/images", "/js", "/css"],
  :root => "public"

run lambda { |env|
  request = Rack::Request.new(env)
  [
    200,
    {
      'Content-Type'  => 'text/html',
      'Cache-Control' => 'public, max-age=86400'
    },
    File.open('public/secure.html', File::RDONLY)
  ]
}
