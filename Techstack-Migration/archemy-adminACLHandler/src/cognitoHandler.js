const {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} = require('@aws-sdk/client-cognito-identity-provider');
const { randomUUID } = require('crypto');
const aclStore = require('./aclStore');
const { aclForRole } = require('./permissions');

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolId = process.env.USER_POOL_ID;

function requireUserPool() {
  if (!userPoolId) throw new Error('Missing USER_POOL_ID environment variable');
}

function normalizeInvite(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();
  const role = String(input.role || 'user').trim();

  return {
    email,
    firstName,
    lastName,
    role,
    userACL: aclForRole(role, input.userACL),
    customerId: input.customerId,
    customerName: input.customerName,
  };
}

async function inviteUser(input) {
  requireUserPool();

  const user = normalizeInvite(input);
  if (!user.email) return { success: false, message: 'Email is required' };

  const userId = randomUUID();
  const now = new Date().toISOString();
  const record = {
    userId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    role: user.role,
    userACL: user.userACL,
    customerId: user.customerId,
    customerName: user.customerName,
    status: 'INVITED',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await aclStore.createUserRecord(record);
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return { success: false, message: 'A user ACL record with this userId already exists' };
    }
    throw error;
  }

  try {
    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: user.firstName },
        { Name: 'family_name', Value: user.lastName },
        { Name: 'custom:userId', Value: userId },
        { Name: 'custom:role', Value: user.role },
      ],
    });

    const response = await cognitoClient.send(command);
    return {
      success: true,
      message: 'User invited successfully',
      user: record,
      cognitoUser: response.User,
    };
  } catch (error) {
    await aclStore.deleteUser(userId);

    if (error.name === 'UsernameExistsException') {
      return { success: false, message: 'A user with this email already exists' };
    }
    if (error.name === 'InvalidParameterException') {
      return {
        success: false,
        message: 'Cognito rejected the invite. Confirm custom:userId and custom:role exist in the user pool.',
        detail: error.message,
      };
    }
    throw error;
  }
}

async function getUsers() {
  const users = await aclStore.getUsers();
  return { success: true, users };
}

async function getUserById(userId) {
  if (!userId) return { success: false, message: 'userId is required' };
  const user = await aclStore.getUser(userId);
  return user ? { success: true, user } : { success: false, message: 'User not found' };
}

async function deleteUser(userId) {
  requireUserPool();
  if (!userId) return { success: false, message: 'userId is required' };

  const user = await aclStore.getUser(userId);
  if (!user) return { success: false, message: 'User not found' };

  try {
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: user.email,
      }),
    );
  } catch (error) {
    if (error.name !== 'UserNotFoundException') throw error;
  }

  await aclStore.deleteUser(userId);
  return { success: true, message: 'User deleted successfully' };
}

async function updateUserAcl(userId, userACL) {
  if (!userId) return { success: false, message: 'userId is required' };
  if (!userACL || typeof userACL !== 'object') return { success: false, message: 'userACL object is required' };

  const user = await aclStore.updateUserAcl(userId, userACL);
  return { success: true, user };
}

async function setUserRole(userId, role, userACL = null) {
  requireUserPool();
  if (!userId) return { success: false, message: 'userId is required' };
  if (!role) return { success: false, message: 'role is required' };

  const existing = await aclStore.getUser(userId);
  if (!existing) return { success: false, message: 'User not found' };

  const nextAcl = aclForRole(role, userACL || existing.userACL);
  const user = await aclStore.updateUserRole(userId, role, nextAcl);

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      UserAttributes: [{ Name: 'custom:role', Value: role }],
    }),
  );

  return { success: true, user };
}

module.exports = {
  deleteUser,
  getUserById,
  getUsers,
  inviteUser,
  setUserRole,
  updateUserAcl,
};
