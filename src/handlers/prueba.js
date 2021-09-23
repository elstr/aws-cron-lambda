const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()

exports.handler = async (event) => {
  const cloudwatchevents = new AWS.CloudWatchEvents()

  const nextInterval = 1 // next interval of the lambda l

  const currentTime = new Date().getTime() // UTC Time

  const nextTime = createCronRunTime(currentTime, 'minute', nextInterval)
  const nextMinutes = nextTime.getMinutes()
  const nextHours = nextTime.getHours()

  const scheduleExpression = 'cron(' + nextMinutes + ' ' + nextHours + ' 23 09 ? 2021)'

  console.log('Expression', scheduleExpression)

  const params = {
    Name: 'MyEvent',
    ScheduleExpression: scheduleExpression
  }

  const createdEvent = await createEvent(cloudwatchevents, params)
  console.log('--->>>', createdEvent)

  const targetResponse = await attachTarget(cloudwatchevents)
  console.log('targetResponse --->>>', targetResponse)

  // Trust Cloud-watch Service Principle to Invoke this lambda

  const lambdaPermission = await attachPermission(targetResponse.RuleArn)
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
    FunctionName: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-prueba',
    Principal: 'events.amazonaws.com',
    SourceArn: source,
    StatementId: `my-scheduled-event-${Math.floor(Math.random() * 100)}`
  }
  return new Promise((resolve, reject) => {
    lambda.addPermission(params, function (err, data) {
      if (err) reject(err, err.stack)
      // an error occurred
      else resolve(data) // successful response
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

const attachTarget = (cloudwatchevents) => {
  const params = {
    Rule: 'MyEvent' /* Name of your event */,
    Targets: [
      {
        Arn: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-prueba',
        Id: 'random-id-123453'
      }
    ]
  }
  return new Promise((resolve, reject) => {
    cloudwatchevents.putTargets(params, function (err, data) {
      if (err) reject(err)
      // an error occurred
      else resolve(data) // successful response
    })
  })
}

const createCronRunTime = (date, interval, units) => {
  let ret = new Date(date) // don't change original date
  switch (interval.toLowerCase()) {
    case 'year':
      ret.setFullYear(ret.getFullYear() + units)
      break
    case 'quarter':
      ret.setMonth(ret.getMonth() + 3 * units)
      break
    case 'month':
      ret.setMonth(ret.getMonth() + units)
      break
    case 'week':
      ret.setDate(ret.getDate() + 7 * units)
      break
    case 'day':
      ret.setDate(ret.getDate() + units)
      break
    case 'hour':
      ret.setTime(ret.getTime() + units * 3600000)
      break
    case 'minute':
      ret.setTime(ret.getTime() + units * 60000)
      break
    case 'second':
      ret.setTime(ret.getTime() + units * 1000)
      break
    default:
      ret = undefined
      break
  }
  return ret
}
