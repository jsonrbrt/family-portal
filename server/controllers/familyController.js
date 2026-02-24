const Family = require("../models/Family");
const User = require("../models/User");

// desc Get family details with members
// route GET /api/families/my-family
// access Private

const getMyFamily = async(req, res) => {
    try {
        if (!req.user.family) {
            return res.status(404).json({ message: 'You are not part of any family' });
        }

        const family = await Family.findById(req.user.family)
        .populate('members', 'name email username profilePhoto role')
        .populate('admins', 'name email username');

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.json(family);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message});
    }
};

// desc Join family using invite code
// route POST api/families/join
// access Private

const joinFamily = async(req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: 'Please provide an invite code' });
        }

        // Check if user already in a family
        if (req.user.family) {
            return res.status(400).json({ message: 'You are already part of a family' });
        }

        // Find family by invite code
        const family = await Family.findOne({ inviteCode: inviteCode.toUpperCase() });

        if (!family) {
            return res.status(404).json({ message: 'Invalid invite code' });
        }

        // Add user to family
        family.members.push(req.user._id);
        await family.save();

        // Update user's family reference
        req.user.family = family._id;
        await req.user.save();

        // Return updated family
        const updatedFamily = await Family.findById(family._id)
        .populate('members', 'name email username profilePhoto')
        .populate('admins', 'name email username');

        res.json({
            message: 'Successfully joined family',
            family: updatedFamily
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', message: error.message });
    }
};

// desc Remove member from family (admin only)
// route DELETE api/families/member/:userId
// access Private/admin

const removeMember = async(req, res) => {
    try {
        const { userId } = req.params;

        const family = await Family.findById(req.user.family);

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        // Check if user is a member
        const isMember = family.members.some(
            memberId => memberId.toString() === userId
        );

        if (!isMember) {
            return res.status(404).json({ message: 'User is not a member of this family' });
        }

        // Can't remove yourself if you're the only admin
        if (userId === req.user._id.toString() && family.admins.length === 1) {
            return res.status(400).json({ message: 'Cannot remove yourself as the only admin' });
        }

        // Remove from members array
        family.members = family.members.filter(
            memberId => memberId.toString() !== userId
        );

        // Remove from admins array if they were an admin
        family.admins = family.admins.filter(
            adminId => adminId.toString() !== userId
        );

        await family.save();

        // Update user's family reference
        await User.findByIdAndUpdate(userId, { family: null,
            role: 'member'
         });

        res.json({
            message: 'Member removed successfully',
            family: await Family.findById(family._id)
            .populate('members', 'name email username')
            .populate('admins', 'name email username')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Make user a family admin
// route PUT /api/families/members/:userId/make-admin
// access Private/admin

const makeAdmin = async(req, res) => {
    try {
        const { userId } = req.params;

        const family = await Family.findById(req.user.family);

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        // Check if user is a member
        if (!family.members.includes(userId)) {
            return res.status(404).json({ message: 'User is not a member of this family' });
        }

        // Check if already admin
        if (family.admins.includes(userId)) {
            return res.status(400).json({ message: 'User is already an admin' });
        }

        // Add to admins
        family.admins.push(userId);
        await family.save();

        // Update user role
        await User.findByIdAndUpdate(userId, { role: 'admin' });

        res.json({
            message: 'User is now a family admin',
            family: await Family.findById(family._id)
            .populate('members', 'name email username')
            .populate('admins', 'name email username')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json ({ message: 'Server error', error: error.message});
    }
};

module.exports = {
    getMyFamily,
    joinFamily,
    removeMember,
    makeAdmin
};