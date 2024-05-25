// API.js
const SERVER_DOMAIN = process.env.EXPO_PUBLIC_SERVER_DOMAIN;

export const fetchPersonDetails = async (person_id) => {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/person/get_person.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ person_id }),
    });
    const result = await response.json();
    return result.person;
  } catch (error) {
    throw new Error('Failed to fetch person details from server');
  }
};

export const searchPersonByName = async (name) => {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/person/search_person_by_name.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    return result.persons;
  } catch (error) {
    throw new Error('Failed to fetch data from server');
  }
};
