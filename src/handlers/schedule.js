const AWS = require('aws-sdk')
const eventBridge = new AWS.EventBridge()
const lambda = new AWS.Lambda()

exports.handler = async () => {
  console.log('EVENT: Lambda test-schedule with CloudWatch Events')

  const nextTime = createCronRunTime(1) // le paso 1 minuto
  const scheduleExpression = `cron(${nextTime.getMinutes()} ${nextTime.getHours()} 23 09 ? 2021)`
  console.log('scheduleExpression --->', scheduleExpression)

  const ruleName = `cron-test-${Math.floor(Math.random() * 100)}`

  await createRule(ruleName, scheduleExpression)

  const result = await attachRuleToTarget(ruleName)

  return { statusCode: 200, body: JSON.stringify(result) }
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

const createRule = async (ruleName, scheduleExpression) => {
  const ruleParams = {
    Name: ruleName,
    ScheduleExpression: scheduleExpression,
    State: 'ENABLED',
    Description: 'Schedule Lambda Execution'
  }

  const rule = await eventBridge.putRule(ruleParams).promise()
  console.log('rule creada - ', rule)
}

const attachRuleToTarget = async (ruleName) => {
  const targetParams = {
    Rule: ruleName,
    Targets: [
      {
        Id: `mailer-function-${Math.floor(Math.random() * 100)}`,
        Arn: 'arn:aws:lambda:us-west-2:772561320311:function:pruebas-scheduler-qa-mailer',
        // Arn: `arn:aws:lambda:${process.env.REGION}:${process.env.ACCOUNT_ID}:function:mailer-${process.env.NODE_ENV}`,
        Input: '{ "data": "data for mailer" }',
        RetryPolicy: {
          MaximumRetryAttempts: 5,
          MaximumEventAgeInSeconds: 300
        }
      }
    ]
  }

  const result = await eventBridge.putTargets(targetParams).promise()
  console.log('esto es result - ', result)
  return result
}
