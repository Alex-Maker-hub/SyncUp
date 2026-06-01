// Shared utilities and mock arrays for server modules

export const choose = <T>(arr: T[] | readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const ADJECTIVES = [
  'Serene', 'Calm', 'Gentle', 'Quiet', 'Mindful', 'Peaceful', 'Radiant', 
  'Warm', 'Cozy', 'Sleeping', 'Dreamy', 'Floating', 'Silent', 'Grateful'
] as const;

export const ANIMALS = [
  'Octopus', 'Seastar', 'Panda', 'Koala', 'Deer', 'Fox', 'Sprout', 
  'Cloud', 'Otter', 'Turtle', 'Rabbit', 'Sparrow', 'Dolphin', 'Squirrel'
] as const;
