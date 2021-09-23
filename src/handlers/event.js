const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()

const ruleName = `cron-test-${Math.floor(Math.random() * 100)}`

exports.handler = async (event) => {
  const cloudwatchevents = new AWS.CloudWatchEvents()

  const nextInterval = 1
  const nextTime = createCronRunTime(nextInterval)

  const scheduleExpression = `cron(${nextTime.getMinutes()} ${nextTime.getHours()} 23 09 ? 2021)`
  console.log('scheduleExpression --->', scheduleExpression)

  const params = {
    Name: ruleName,
    ScheduleExpression: scheduleExpression
  }

  const createdEvent = await createEvent(cloudwatchevents, params)
  console.log('--->>>', createdEvent)

  const targetResponse = await attachTarget(cloudwatchevents)
  console.log('targetResponse --->>>', targetResponse)

  // Trust Cloud-watch Service Principle to Invoke this lambda
  const lambdaPermission = await attachPermission()
  console.log('attachPermission ===>', lambdaPermission)

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!')
  }
  return response
}

async function attachPermission(source) {
  const params = {
    Action: 'lambda:InvokeFunction',
    FunctionName: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-mailer',
    // FunctionName: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-mailer',
    Principal: 'events.amazonaws.com',
    SourceArn: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-event',
    // SourceArn: source,
    StatementId: 'my-scheduled-event'
  }
  return new Promise((resolve, reject) => {
    lambda.addPermission(params, function (err, data) {
      if (err) reject(err, err.stack)
      // an error occurred
      else resolve(data) // successful response
    })
  })
}

const attachTarget = (cloudwatchevents) => {
  const params = {
    Rule: ruleName,
    Targets: [
      {
        Arn: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-mailer',
        Id: `id-mailer-random-${Math.floor(Math.random())}`
      }
    ]
  }
  return new Promise((resolve, reject) => {
    cloudwatchevents.putTargets(params, function (err, data) {
      if (err) {
        console.log('attach error - ', err)
        reject(err)
      }
      // an error occurred
      else {
        console.log('attach result - ', data)
        resolve(data) // successful response
      }
    })
  })
}

async function createEvent(cloudwatchevents, params) {
  return new Promise((resolve, reject) => {
    cloudwatchevents.putRule(params, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const createCronRunTime = (units) => {
  const currentTime = new Date().getTime() // UTC Time
  console.log('currentTime - ', currentTime)
  let ret = new Date(currentTime) // don't change original date
  console.log('ret -', ret)
  ret.setTime(ret.getTime() + units * 60000)
  console.log('setTime -', ret)
  return ret
}
