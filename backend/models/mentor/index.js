const { getMentorConnection } = require('../../config/mentorDatabase');

let models = null;

const initializeMentorModels = () => {
  if (!models) {
    const connection = getMentorConnection();
    
    const MentorUserModel = require('./MentorUser');
    const MentorProfileModel = require('./MentorProfile');
    const MentorSessionModel = require('./MentorSession');
    
    models = {
      MentorUser: MentorUserModel.createModel(connection),
      MentorProfile: MentorProfileModel.createModel(connection),
      MentorSession: MentorSessionModel.createModel(connection)
    };
  }
  
  return models;
};

// Export individual models with lazy loading
module.exports = {
  get MentorUser() {
    return initializeMentorModels().MentorUser;
  },
  get MentorProfile() {
    return initializeMentorModels().MentorProfile;
  },
  get MentorSession() {
    return initializeMentorModels().MentorSession;
  },
  getMentorModels: initializeMentorModels
};