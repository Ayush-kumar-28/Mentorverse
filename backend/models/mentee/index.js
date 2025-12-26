const { getMenteeConnection } = require('../../config/menteeDatabase');

let models = null;

const initializeMenteeModels = () => {
  if (!models) {
    const connection = getMenteeConnection();
    
    const MenteeUserModel = require('./MenteeUser');
    const MenteeProfileModel = require('./MenteeProfile');
    const MenteeSessionModel = require('./MenteeSession');
    
    models = {
      MenteeUser: MenteeUserModel.createModel(connection),
      MenteeProfile: MenteeProfileModel.createModel(connection),
      MenteeSession: MenteeSessionModel.createModel(connection)
    };
  }
  
  return models;
};

// Export individual models with lazy loading
module.exports = {
  get MenteeUser() {
    return initializeMenteeModels().MenteeUser;
  },
  get MenteeProfile() {
    return initializeMenteeModels().MenteeProfile;
  },
  get MenteeSession() {
    return initializeMenteeModels().MenteeSession;
  },
  getMenteeModels: initializeMenteeModels
};