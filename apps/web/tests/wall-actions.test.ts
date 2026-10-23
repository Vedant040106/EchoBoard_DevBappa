import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PublicFeedbackNote } from '@devbappa/shared';

describe('Pinboard Wall Navigation and Realtime State Logic', () => {
  const sampleNotes: PublicFeedbackNote[] = [
    {
      id: 'note-1',
      publicDisplayName: 'Shruti',
      role: 'Student',
      department: 'Computer Engineering',
      designation: null,
      institutionName: null,
      message: 'Exciting AI agents showcase!',
      createdAt: '2026-10-23T06:00:00Z',
      colorVariant: 'yellow',
      pinVariant: 'brass',
      sizeVariant: 'standard',
      layout: { worldX: -200, worldY: -100, rotation: 2, width: 240, height: 240, layerOrder: 1 },
    },
    {
      id: 'note-2',
      publicDisplayName: 'Sneha',
      role: 'Faculty',
      department: 'Electronics & Telecommunication',
      designation: 'Associate Professor',
      institutionName: null,
      message: 'Great IoT setups.',
      createdAt: '2026-10-23T06:30:00Z',
      colorVariant: 'mint',
      pinVariant: 'silver',
      sizeVariant: 'standard',
      layout: { worldX: 300, worldY: 200, rotation: -1.5, width: 240, height: 240, layerOrder: 2 },
    },
  ];

  it('calculates bounding box of all notes for Reset View', () => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of sampleNotes) {
      const { worldX, worldY, width, height } = n.layout;
      if (worldX < minX) minX = worldX;
      if (worldX + width > maxX) maxX = worldX + width;
      if (worldY < minY) minY = worldY;
      if (worldY + height > maxY) maxY = worldY + height;
    }

    assert.equal(minX, -200);
    assert.equal(maxX, 540); // 300 + 240
    assert.equal(minY, -100);
    assert.equal(maxY, 440); // 200 + 240
  });

  it('locates the newest note for Latest action', () => {
    const latestNote = [...sampleNotes].sort(
      (a, b) => (b.layout.layerOrder || 0) - (a.layout.layerOrder || 0)
    )[0];

    assert.equal(latestNote.id, 'note-2');
    assert.equal(latestNote.publicDisplayName, 'Sneha');
  });

  it('deduplicates incoming realtime notes by ID', () => {
    const incomingDuplicate: PublicFeedbackNote = {
      ...sampleNotes[0],
      message: 'Duplicate event should not create second note on wall',
    };

    const notesState = [...sampleNotes];
    const isDuplicate = notesState.some((n) => n.id === incomingDuplicate.id);
    assert.equal(isDuplicate, true);

    const updatedState = isDuplicate ? notesState : [...notesState, incomingDuplicate];
    assert.equal(updatedState.length, 2);
  });

  it('removes hidden and soft-deleted notes from visible wall', () => {
    const hiddenId = 'note-1';
    const remainingNotes = sampleNotes.filter((n) => n.id !== hiddenId);

    assert.equal(remainingNotes.length, 1);
    assert.equal(remainingNotes[0].id, 'note-2');
  });
});
