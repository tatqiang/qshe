import { supabase } from '../lib/api/supabase';

interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_type: string;
  status: string;
  face_descriptors: any;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database Face Recognition Testing Utility
 * This helps test face recognition with real database data
 */
export class DatabaseFaceTestingService {
  
  /**
   * Get all users from database with their face data
   */
  static async getAllUsersWithFaceData() {
    try {
      console.log('🔍 Fetching users from database...');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          status,
          face_descriptors,
          profile_photo_url,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error:', error);
        return { success: false, error: error.message, data: [] };
      }

      const users = (data || []) as DatabaseUser[];
      console.log(`✅ Found ${users.length} users in database`);
      
      // Analyze face data
      const usersWithFaces = users.filter(user => user.face_descriptors);
      console.log(`👤 Users with face data: ${usersWithFaces.length}`);
      
      usersWithFaces.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`    Face data type:`, typeof user.face_descriptors);
        console.log(`    Face data:`, user.face_descriptors);
      });

      return { 
        success: true, 
        data: users,
        usersWithFaces: usersWithFaces.length,
        totalUsers: users.length
      };
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  /**
   * Test face data format and structure
   */
  static async testFaceDataStructure() {
    const result = await this.getAllUsersWithFaceData();
    
    if (!result.success) {
      return result;
    }

    console.log('🧪 Testing face data structure...');
    
    const usersWithFaces = result.data.filter((user: DatabaseUser) => user.face_descriptors);
    
    for (const user of usersWithFaces) {
      console.log(`\n👤 Testing user: ${user.first_name} ${user.last_name}`);
      console.log('Face descriptors raw data:', user.face_descriptors);
      
      try {
        // Test different parsing methods
        if (user.face_descriptors) {
          if (typeof user.face_descriptors === 'object') {
            console.log('  ✅ Face data is object type');
            
            if (user.face_descriptors.face_descriptor) {
              console.log('  ✅ Has face_descriptor field');
              console.log('  📊 Descriptor length:', user.face_descriptors.face_descriptor.length);
              console.log('  📊 First few values:', user.face_descriptors.face_descriptor.slice(0, 5));
            }
            
            if (user.face_descriptors.quality) {
              console.log('  ✅ Has quality data:', user.face_descriptors.quality);
            }
            
            if (user.face_descriptors.detection_metadata) {
              console.log('  ✅ Has detection metadata');
            }
          }
        }
      } catch (error) {
        console.error('  ❌ Error parsing face data:', error);
      }
    }

    return {
      success: true,
      usersWithFaces: usersWithFaces.length,
      faceDataSamples: usersWithFaces.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        faceDataType: typeof user.face_descriptors,
        hasFaceDescriptor: !!(user.face_descriptors && user.face_descriptors.face_descriptor),
        descriptorLength: user.face_descriptors?.face_descriptor?.length || 0
      }))
    };
  }

  /**
   * Register a new user's face data to the database
   */
  static async registerFaceData(userId: string, faceDescriptor: Float32Array, detectionResult: any) {
    try {
      console.log(`💾 Registering face data for user ${userId}...`);
      
      const faceData = {
        face_descriptor: Array.from(faceDescriptor),
        quality: detectionResult.quality,
        detection_metadata: detectionResult,
        registered_at: new Date().toISOString(),
        is_active: true
      };

      const { data, error } = await (supabase as any)
        .from('users')
        .update({ face_descriptors: faceData })
        .eq('id', userId)
        .select('id, first_name, last_name, email');

      if (error) {
        console.error('❌ Error registering face data:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Face data registered successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in registerFaceData:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get face comparison data in the correct format
   */
  static transformDatabaseUser(dbUser: any) {
    const faceDescriptors = [];
    
    if (dbUser.face_descriptors) {
      if (dbUser.face_descriptors.face_descriptor) {
        // Convert array back to Float32Array
        faceDescriptors.push(new Float32Array(dbUser.face_descriptors.face_descriptor));
      }
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      userType: dbUser.user_type,
      status: dbUser.status,
      profilePhotoUrl: dbUser.profile_photo_url,
      faceDescriptors,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }
}

export default DatabaseFaceTestingService;
