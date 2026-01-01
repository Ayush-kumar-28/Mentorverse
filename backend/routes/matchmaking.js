const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const validateRequest = [
  body('profile.currentSkills').isString().trim().notEmpty(),
  body('profile.desiredSkills').isString().trim().notEmpty(),
  body('profile.careerGoals').isString().trim().notEmpty(),
  body('profile.industryInterests').isString().trim().notEmpty(),
  body('mentors').isArray({ min: 1 }),
  body('mentors.*.name').isString().trim().notEmpty(),
  body('mentors.*.title').isString().trim().notEmpty(),
  body('mentors.*.company').isString().trim().notEmpty(),
  body('mentors.*.expertise').optional().isArray(),
  body('mentors.*.availability').optional().isObject(),
];

const tokenize = (value) => {
  const set = new Set();
  const phrases = [];

  String(value || '')
    .split(/[,&/\n]/)
    .map((segment) => segment.replace(/and/gi, ' ').trim())
    .filter(Boolean)
    .forEach((segment) => {
      const lower = segment.toLowerCase();
      phrases.push({ original: segment, lower });
      set.add(lower);
      segment
        .split(/\s+/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 2)
        .forEach((word) => set.add(word));
    });

  return {
    values: Array.from(set),
    phrases,
  };
};

const normalizeExpertise = (expertise) =>
  (Array.isArray(expertise) ? expertise : [])
    .map((item) => String(item).toLowerCase());

const availabilityCount = (availability = {}) =>
  Object.values(availability).reduce((total, slots) => {
    if (Array.isArray(slots)) {
      return total + slots.length;
    }
    return total;
  }, 0);

const dedupe = (items) => Array.from(new Set(items));

const computeMatches = (mentor, tokens) => {
  const expertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const expertiseLower = normalizeExpertise(expertise);
  const expertiseText = expertiseLower.join(' ');
  const company = String(mentor.company || '').toLowerCase();
  const title = String(mentor.title || '').toLowerCase();
  const bio = String(mentor.bio || '').toLowerCase();

  const skillMatches = dedupe(
    expertise.filter((item, index) =>
      tokens.desired.values.some((token) => expertiseLower[index].includes(token))
    )
  );

  const growthMatches = dedupe(
    expertise.filter((item, index) =>
      tokens.current.values.some((token) => expertiseLower[index].includes(token))
    )
  );

  const industryMatches = dedupe(
    tokens.industry.phrases
      .filter(({ lower }) =>
        company.includes(lower) ||
        title.includes(lower) ||
        expertiseText.includes(lower) ||
        bio.includes(lower)
      )
      .map(({ original }) => original)
  );

  return {
    skillMatches,
    growthMatches,
    industryMatches,
  };
};

const buildReason = (mentor, matches, totalSlots) => {
  const parts = [];

  if (matches.skillMatches.length) {
    const highlighted = matches.skillMatches.slice(0, 3).map((skill) => skill.replace(/\b\w/g, (c) => c.toUpperCase()));
    parts.push(`Expert in ${highlighted.join(', ')}`);
  }

  if (!matches.skillMatches.length && matches.growthMatches.length) {
    const highlighted = matches.growthMatches.slice(0, 3).map((skill) => skill.replace(/\b\w/g, (c) => c.toUpperCase()));
    parts.push(`Experienced with your current skills: ${highlighted.join(', ')}`);
  }

  if (matches.industryMatches.length) {
    const highlighted = matches.industryMatches.slice(0, 2).map((interest) => interest.replace(/\b\w/g, (c) => c.toUpperCase()));
    parts.push(`Works closely with ${highlighted.join(' & ')}`);
  }

  if (totalSlots > 0) {
    parts.push(`Has ${totalSlots} upcoming time slot${totalSlots > 1 ? 's' : ''} available`);
  }

  if (!parts.length) {
    parts.push(`Strong background as ${mentor.title} at ${mentor.company}`);
  }

  return parts.join('. ') + '.';
};

router.post('/', validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid request payload', errors: errors.array() });
  }

  const profile = {
    currentSkills: req.body.profile.currentSkills.trim(),
    desiredSkills: req.body.profile.desiredSkills.trim(),
    careerGoals: req.body.profile.careerGoals.trim(),
    industryInterests: req.body.profile.industryInterests.trim(),
  };

  const mentors = req.body.mentors;

  const tokens = {
    current: tokenize(profile.currentSkills),
    desired: tokenize(profile.desiredSkills),
    industry: tokenize(profile.industryInterests),
  };

  const scored = mentors.map((mentor) => {
    const matches = computeMatches(mentor, tokens);
    const slots = availabilityCount(mentor.availability);
    const score = (
      matches.skillMatches.length * 4 +
      matches.growthMatches.length * 2 +
      matches.industryMatches.length * 3 +
      (slots > 0 ? 1 : 0)
    );

    return {
      mentor,
      matches,
      slots,
      score,
    };
  });

  const sorted = scored
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.slots !== a.slots) {
        return b.slots - a.slots;
      }
      return String(a.mentor.name).localeCompare(String(b.mentor.name));
    });

  const primary = sorted
    .filter((item) => item.score > 0)
    .slice(0, 4)
    .map((item) => ({
      ...item.mentor,
      matchReasoning: buildReason(item.mentor, item.matches, item.slots),
    }));

  const fallback = primary.length > 0 ? primary : sorted.slice(0, 4).map((item) => ({
    ...item.mentor,
    matchReasoning: buildReason(item.mentor, item.matches, item.slots),
  }));

  res.json({ mentors: fallback });
});

module.exports = router;
