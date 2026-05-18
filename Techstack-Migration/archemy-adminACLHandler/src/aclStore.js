const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const userTable = process.env.USER_ACL_TABLE || 'Archemy-userACL';

async function createUserRecord(user) {
  await docClient.send(
    new PutCommand({
      TableName: userTable,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    }),
  );
  return user;
}

async function putUserRecord(user) {
  await docClient.send(
    new PutCommand({
      TableName: userTable,
      Item: user,
    }),
  );
  return user;
}

async function getUser(userId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: userTable,
      Key: { userId },
    }),
  );
  return result.Item || null;
}

async function getUsers() {
  const users = [];
  let ExclusiveStartKey;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: userTable,
        ExclusiveStartKey,
      }),
    );
    users.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return users.sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
}

async function deleteUser(userId) {
  await docClient.send(
    new DeleteCommand({
      TableName: userTable,
      Key: { userId },
    }),
  );
}

async function updateUserAcl(userId, userACL) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: userTable,
      Key: { userId },
      UpdateExpression: 'SET userACL = :userACL, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':userACL': userACL,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes;
}

async function updateUserRole(userId, role, userACL) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: userTable,
      Key: { userId },
      UpdateExpression: 'SET #role = :role, userACL = :userACL, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#role': 'role',
      },
      ExpressionAttributeValues: {
        ':role': role,
        ':userACL': userACL,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes;
}

async function updateUserStatus(userId, status) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: userTable,
      Key: { userId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes;
}

module.exports = {
  createUserRecord,
  deleteUser,
  getUser,
  getUsers,
  putUserRecord,
  updateUserAcl,
  updateUserRole,
  updateUserStatus,
  userTable,
};
