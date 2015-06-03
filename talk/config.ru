use Rack::Static,
  :urls => ["/images", "/js", "/css"],
  :root => "public"

run lambda { |env|
  @slide_content = File.read('./slides.md')
  [
    200,
    {
      'Content-Type'  => 'text/html',
      'Cache-Control' => 'public, max-age=86400'
    },
    [ERB.new(File.read('./slides.html')).result(binding)]
  ]
}
