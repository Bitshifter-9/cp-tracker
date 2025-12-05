import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  teamName: {
    type: String,
    default: function () {
      return `Team ${this.teamId}`;
    }
  },
  members: [{
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

// Ensure username is unique within a team
teamSchema.index({ 'members.username': 1, teamId: 1 }, { unique: true });

export default mongoose.model('Team', teamSchema);
