/*!
 * node-s3-url-encode
 */
export default function encodeS3URI(filename) {
  		return encodeURI(filename)
              .replace(/\+/, '%2B')
              .replace(/\!/, '%21')
              .replace(/\"/, '%22')
              .replace(/\#/, '%23')
              .replace(/\$/, '%24')
              .replace(/\&/, '%26')
              .replace(/\'/, '%27')
              .replace(/\(/, '%28')
              .replace(/\)/, '%29')
              .replace(/\*/, '%2A')
              .replace(/\+/, '%2B')
              .replace(/\,/, '%2C')
              .replace(/\:/, '%3A')
              .replace(/\;/, '%3B')
              .replace(/\=/, '%3D')
              .replace(/\?/, '%3F')
              .replace(/\@/, '%40');
};
