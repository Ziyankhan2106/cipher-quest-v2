export const fetchMission = async (id: string) => {
  const res = await fetch(`/api/story/mission/${id}`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export const fetchHint = async (data: any) => {
  const res = await fetch('/api/story/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export const getStoryProfile = async () => {
  const res = await fetch('/api/story/profile');
  if (!res.ok) throw new Error('Failed to fetch story profile');
  return res.json();
};

export const completeMissionOnServer = async (missionId: string) => {
  const res = await fetch('/api/story/complete-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId }),
  });
  if (!res.ok) throw new Error('Failed to complete mission');
  return res.json();
};
