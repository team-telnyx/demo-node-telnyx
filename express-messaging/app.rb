
require 'sinatra'
require 'telnyx'
require 'dotenv/load'
require 'json'
require 'ostruct'
require 'aws-sdk-s3'
require 'down'

if __FILE__ == $0
  TELNYX_API_KEY=ENV.fetch("TELNYX_API_KEY")
  TELNYX_APP_PORT=ENV.fetch("TELNYX_APP_PORT")
  AWS_REGION = ENV.fetch("AWS_REGION")
  TELNYX_MMS_S3_BUCKET = ENV.fetch("TELNYX_MMS_S3_BUCKET")
  Telnyx.api_key = TELNYX_API_KEY
  set :port, TELNYX_APP_PORT
end

def deserialize_json(json)
  object = JSON.parse(json, object_class: OpenStruct)
  object
end

def upload_file(file_path)
  s3 = Aws::S3::Resource.new(region: AWS_REGION)
  name = File.basename(file_path)
  obj = s3.bucket(TELNYX_MMS_S3_BUCKET).object(name)
  obj.upload_file(file_path, acl: 'public-read')
  obj.public_url
end

def download_file(uri)
  temp_file = Down.download(uri)
  path = "./#{temp_file.original_filename}"
  FileUtils.mv(temp_file.path, path)
  path
end

get '/' do
  "Hello World"
end

post '/messaging/inbound' do
  webhook = deserialize_json(request.body.read)
  dlr_uri = URI::HTTP.build(host: request.host, path: '/messaging/outbound')
  to_number = webhook.data.payload.to[0].phone_number
  from_number = webhook.data.payload.from.phone_number
  media = webhook.data.payload.media
  file_paths = []
  media_urls = []
  if media.any?
    media.each do |item|
      file_path = download_file(item.url)
      file_paths.push(file_path)
      media_url = upload_file(file_path)
      media_urls.push(media_url)
    end
  end

  begin
    telnyx_response = Telnyx::Message.create(
        from: to_number,
        to: from_number,
        text: "Hello, world!",
        media_urls: media_urls,
        use_profile_webhooks: false,
        webhook_url: dlr_uri.to_s
    )
    puts "Sent message with id: #{telnyx_response.id}"
  rescue Exception => ex
    puts ex
  end
end

post '/messaging/outbound' do
  webhook = deserialize_json(request.body.read)
  puts "Received message DLR with ID: #{webhook.data.payload.id}"
end