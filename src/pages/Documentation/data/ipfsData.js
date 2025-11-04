export const ipfsData = {
  gateway: 'https://ipfs.io/ipfs/',
  docs: 'IPFS stores job descriptions, submission proofs, and dispute evidence.',
  examples: [
    {
      title: 'Upload Job Description',
      description: 'Store job requirements on IPFS.',
      code: 'const hash = await uploadToIPFS(jobData);'
    },
    {
      title: 'Retrieve Job',
      description: 'Fetch job details using IPFS hash.',
      code: 'const job = await getFromIPFS(hash);'
    }
  ]
};
