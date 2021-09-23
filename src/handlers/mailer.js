exports.handler = async (event) => {
  console.log('llego a mailer')
  console.log('event recibido - ', event)
  return { statusCode: 200, body: JSON.stringify('Llegamos a mailer') }
}
