import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';
import fs from 'fs/promises';
import path from 'path';
import imageThumbnail from 'image-thumbnail';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) throw new Error('File not found');
  
  const filePath = file.localPath;
  if (!filePath) throw new Error('File path not found');

  try {
    const sizes = [500, 250, 100];
    for (const size of sizes) {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const newFilePath = `${filePath}_${size}`;
      await fs.writeFile(newFilePath, thumbnail);
    }
    console.log(`Thumbnails generated for file ${fileId}`);
  } catch (error) {
    console.error(`Error generating thumbnails: ${error.message}`);
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.db.collection('users').findOne({
    _id: new ObjectId(userId),
  });

  if (!user) throw new Error('User not found');
  
  console.log(`Welcome ${user.email}!`);
});

console.log('Worker started and listening for jobs...');

