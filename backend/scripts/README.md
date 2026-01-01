# Database Management Scripts

## Session Cleanup Script

This script helps you clean up sessions from the database.

### Usage

```bash
cd backend
node scripts/cleanupSessions.js [option]
```

### Options

#### 1. Delete All Sessions
```bash
node scripts/cleanupSessions.js all
```
Deletes all sessions from the database.

#### 2. Delete Old Sessions
```bash
node scripts/cleanupSessions.js old
```
Deletes sessions older than 30 days.

#### 3. Delete Cancelled Sessions
```bash
node scripts/cleanupSessions.js cancelled
```
Deletes only cancelled sessions.

#### 4. Delete Past Sessions
```bash
node scripts/cleanupSessions.js past
```
Deletes completed, cancelled, and past upcoming sessions.

### Examples

**Clean up all fake/test sessions:**
```bash
node scripts/cleanupSessions.js all
```

**Remove old sessions to free up space:**
```bash
node scripts/cleanupSessions.js old
```

**Remove only cancelled sessions:**
```bash
node scripts/cleanupSessions.js cancelled
```

### Safety

- The script shows how many sessions will be deleted before deleting
- Shows remaining sessions count after deletion
- Use with caution in production!

### What Was Done

✅ **Already cleaned up**: All 10 fake sessions have been removed from your database.

Your sessions list is now clean and ready for real bookings!

---

## Demo Mentors Population Script

This script helps you populate the database with demo mentor profiles for demonstration purposes.

### Usage

```bash
cd backend
node scripts/populateDemoMentors.js [command]
```

### Commands

#### 1. Create Demo Mentors
```bash
node scripts/populateDemoMentors.js create
```
Creates 10 demo mentor profiles in the database.

#### 2. Remove Demo Mentors
```bash
node scripts/populateDemoMentors.js remove
```
Removes all demo mentor profiles from the database.

#### 3. Recreate Demo Mentors
```bash
node scripts/populateDemoMentors.js recreate
```
Removes existing demo mentors and creates fresh ones.

### Demo Mentors Included

The script creates 10 professional mentor profiles:

1. **Sarah Chen** - Senior Software Engineer at Google
2. **Marcus Johnson** - Product Manager at Microsoft  
3. **Dr. Priya Patel** - Data Science Manager at Netflix
4. **Alex Rodriguez** - UX Design Lead at Airbnb
5. **Jennifer Kim** - DevOps Engineer at Amazon
6. **David Thompson** - Startup Founder & CEO
7. **Lisa Wang** - Mobile App Developer at Spotify
8. **Robert Martinez** - Cybersecurity Architect at Cisco
9. **Emily Davis** - Marketing Director at HubSpot
10. **Michael Brown** - Backend Engineer at Stripe

### Features

- **Realistic Profiles**: Each mentor has detailed bio, experience, and expertise
- **Professional Photos**: High-quality avatar images from Unsplash
- **Availability**: Pre-set availability for booking demonstrations
- **Ratings & Reviews**: Random ratings and session counts for realism
- **Complete Profiles**: All profiles are marked as complete and verified

### Examples

**Add demo mentors for a presentation:**
```bash
node scripts/populateDemoMentors.js create
```

**Clean up after demo:**
```bash
node scripts/populateDemoMentors.js remove
```

**Refresh demo data:**
```bash
node scripts/populateDemoMentors.js recreate
```

### Safety

- Demo mentors use `@demo.mentorverse.com` email addresses
- Easy to identify and remove demo data
- Won't interfere with real user accounts
- Perfect for demonstrations and testing

### Use Cases

- **Live Demos**: Show a populated mentor browse section
- **Development**: Test booking and matching features
- **Presentations**: Professional-looking mentor profiles
- **User Testing**: Realistic data for user experience testing
