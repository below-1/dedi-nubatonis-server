const ImageKit = require("imagekit")
const randomstring = require('randomstring')

const imagekit = new ImageKit({
    publicKey : "public_c7kph38/cLbkisnogMSMTl8PGyg=",
    privateKey : "private_zNqysJBWA8JVySqGUC6OGH7Enns=",
    urlEndpoint : "https://ik.imagekit.io/grahyc7t8rc"
});

module.exports.imagekit = imagekit;

module.exports.uploadBase64 = async (base64) => {
	const extension = base64.substring("data:image/".length, base64.indexOf(";base64"))
  const avatarName = randomstring.generate(8) + '.' + extension;

  try {
    const result = await imagekit.upload({
      file: base64,
      fileName: avatarName
    })
    return {
    	avatarUrl: result.url,
    	avatarThumbnailUrl: result.thumbnailUrl
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}