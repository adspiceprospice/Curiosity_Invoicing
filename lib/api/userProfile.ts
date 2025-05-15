/**
 * API client for user profile management
 */

// Type for user profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// Type for user profile update
export interface UserProfileUpdate {
  name: string;
  image?: string;
}

/**
 * Fetch user profile
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const response = await fetch('/api/settings/user');
    
    if (!response.ok) {
      throw new Error(`Error fetching user profile: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: UserProfileUpdate): Promise<UserProfile> {
  try {
    const response = await fetch('/api/settings/user', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}