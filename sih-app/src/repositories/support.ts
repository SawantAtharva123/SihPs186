import { getDatabase } from '../offline/database';
import { enqueue } from '../offline/syncQueue';
import { SupportRequestRecord, SupportPriority, SupportOptionType, FacilityCategory, SupportPhotoAttachment } from '../types/sahayak';

// In-memory backing cache for zero-latency reactive updates across screens and web/mobile platforms
let inMemoryQueue: SupportRequestRecord[] = [
  {
    id: 'FAC-4019',
    personId: 'anon',
    personName: 'Protected Whistleblower',
    unit: 'Unit 402 / Alpha Coy',
    requestType: 'facility_issue',
    categoryTitle: 'Facility & Accommodation Issue',
    isAnonymous: true,
    priority: 'urgent',
    facilityCategory: 'water',
    location: 'Barracks Block 3 · Ablution Annex',
    notes: 'Drinking water filtration pipeline has heavy sediment and brown silt following monsoon runoff. Multiple personnel reported gastrointestinal discomfort. Urgent replacement of cartridge required.',
    photos: [
      {
        uri: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=60',
        name: 'water_filter_sediment.jpg',
        size: '1.4 MB',
      }
    ],
    status: 'In Progress',
    assignedOfficer: 'Capt. Meera Nair',
    officerNotes: 'Dispatched Military Engineering Services (MES) plumbing detachment. Deployed temporary clean water tanker to Barracks 3.',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'WOC-2810',
    personId: 'person_amit',
    personName: 'Constable Amit Singh',
    unit: 'Unit 402 / Bravo Coy',
    requestType: 'officer_callback',
    categoryTitle: 'Welfare Officer Call Back',
    isAnonymous: false,
    priority: 'high',
    notes: 'Urgent family medical emergency at home (father hospitalized in Bihar). Requesting quick confidential consultation regarding emergency leave and welfare relief grant.',
    preferredTimeWindow: 'Today · 16:30 - 18:00',
    contactPreference: 'Phone Call (Ext. 204 or Mobile)',
    photos: [],
    status: 'Submitted',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'FAC-1192',
    personId: 'person_negi',
    personName: 'Havildar R. S. Negi',
    unit: 'Unit 402 / Mess Section',
    requestType: 'facility_issue',
    categoryTitle: 'Facility & Accommodation Issue',
    isAnonymous: false,
    priority: 'urgent',
    facilityCategory: 'food',
    location: 'Central Mess Cookhouse #2',
    notes: 'Cold storage meat chiller compressor tripped during peak hours. Temperature rising above safety threshold. High risk of perishable ration contamination.',
    photos: [
      {
        uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
        name: 'chiller_fault_display.jpg',
        size: '2.1 MB',
      }
    ],
    status: 'Dispatched',
    assignedOfficer: 'Capt. Meera Nair',
    officerNotes: 'MES Electrical Officer summoned. Perishable meat rations shifted to Backup Unit #1.',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'WKL-5531',
    personId: 'anon',
    personName: 'Protected Whistleblower',
    unit: 'Unit 402 / Charlie Coy',
    requestType: 'workload_issue',
    categoryTitle: 'Workload Issue',
    isAnonymous: true,
    priority: 'high',
    notes: 'Section 2 has completed 7 consecutive night ambushes and perimeter duties without the mandatory 24h restorative sleep interval. Cumulative motor fatigue is evident on patrol.',
    workloadDetails: {
      consecutiveDays: 7,
      issueType: 'Consecutive Night Shifts Without Rest Turnover'
    },
    photos: [],
    status: 'Under Review',
    assignedOfficer: 'Capt. Meera Nair',
    officerNotes: 'Reviewed roster with Company Commander. Stand-down shift replacement planned for tomorrow.',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'FAC-6704',
    personId: 'anon',
    personName: 'Protected Whistleblower',
    unit: 'Unit 402 / Transport Platoon',
    requestType: 'facility_issue',
    categoryTitle: 'Facility & Accommodation Issue',
    isAnonymous: true,
    priority: 'medium',
    facilityCategory: 'transport',
    location: 'Motor Transport Bay #4',
    notes: 'Troop carrier 4x4 exhaust pipe leak venting fumes toward passenger cabin during convoy movements. Needs gasket replacement.',
    photos: [],
    status: 'Acknowledged',
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  }
];

// Helper to generate tactical request IDs matching category
export function generateRequestId(type: SupportOptionType): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  switch (type) {
    case 'facility_issue':
      return `FAC-${rand}`;
    case 'officer_callback':
      return `WOC-${rand}`;
    case 'private_meeting':
      return `MTG-${rand}`;
    case 'buddy_contact':
      return `BDY-${rand}`;
    case 'workload_issue':
      return `WKL-${rand}`;
    case 'schedule_problem':
      return `SCH-${rand}`;
    case 'general_support':
    default:
      return `SUP-${rand}`;
  }
}

/**
 * Creates and registers a new support request or facility report.
 * Supports complete anonymity scrubbing, photo attachments, and priority routing.
 */
export async function createSupportRequest(
  data: Omit<SupportRequestRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    id?: string;
  }
): Promise<SupportRequestRecord> {
  const id = data.id || generateRequestId(data.requestType);
  const now = new Date().toISOString();

  const record: SupportRequestRecord = {
    ...data,
    id,
    personId: data.isAnonymous ? 'anon' : data.personId,
    personName: data.isAnonymous ? 'Protected Whistleblower' : data.personName || 'Personnel',
    status: 'Submitted',
    photos: data.photos || [],
    createdAt: now,
    updatedAt: now,
  };

  // Prepend to in-memory queue
  inMemoryQueue = [record, ...inMemoryQueue];

  // Persist to SQLite
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO support_requests (
        id, client_id, person_id, category, request_type, is_anonymous, notes, status, created_at, updated_at, sync_status, sync_attempts, device_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, 'pending', 0, ?)`,
      [
        id,
        id,
        record.personId,
        record.categoryTitle,
        record.requestType,
        record.isAnonymous ? 1 : 0,
        JSON.stringify({
          notes: record.notes,
          priority: record.priority,
          facilityCategory: record.facilityCategory,
          location: record.location,
          preferredTimeWindow: record.preferredTimeWindow,
          contactPreference: record.contactPreference,
          preferredMeetingLocation: record.preferredMeetingLocation,
          preferredMeetingDate: record.preferredMeetingDate,
          buddyName: record.buddyName,
          workloadDetails: record.workloadDetails,
          scheduleDetails: record.scheduleDetails,
          photos: record.photos,
        }),
        now,
        now,
        now,
      ]
    );

    await enqueue('support_requests', id, 'INSERT', record);
  } catch (err) {
    console.warn('SQLite support_requests insert fallback (memory active):', err);
  }

  return record;
}

/**
 * Legacy wrapper for backward compatibility with existing callers
 */
export async function submitSupportRequest(
  personId: string,
  data: {
    category: string;
    requestType: string;
    isAnonymous: boolean;
    notes: string;
  }
): Promise<string> {
  const req = await createSupportRequest({
    personId,
    unit: 'Unit 402',
    requestType: (data.requestType as SupportOptionType) || 'general_support',
    categoryTitle: data.category,
    isAnonymous: data.isAnonymous,
    priority: 'normal',
    notes: data.notes,
    photos: [],
  });
  return req.id;
}

/**
 * Retrieves support requests for the active personnel.
 * Includes user-submitted items (matching personId or locally created anonymous records).
 */
export async function getSupportRequestsForUser(personId: string): Promise<SupportRequestRecord[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM support_requests WHERE person_id = ? OR person_id = ? ORDER BY created_at DESC',
      [personId, 'anon']
    );

    if (rows && rows.length > 0) {
      // Merge database records with in-memory state
      const dbRecords: SupportRequestRecord[] = rows.map((r) => {
        let parsedPayload: any = {};
        try {
          parsedPayload = JSON.parse(r.notes);
        } catch {
          parsedPayload = { notes: r.notes };
        }

        return {
          id: r.id,
          personId: r.person_id,
          personName: r.is_anonymous ? 'Protected Whistleblower' : 'Rohan Verma',
          unit: 'Unit 402',
          requestType: r.request_type as SupportOptionType,
          categoryTitle: r.category || 'Support Request',
          isAnonymous: Boolean(r.is_anonymous),
          priority: (parsedPayload.priority as SupportPriority) || 'normal',
          facilityCategory: parsedPayload.facilityCategory as FacilityCategory,
          location: parsedPayload.location,
          notes: parsedPayload.notes || r.notes || '',
          preferredTimeWindow: parsedPayload.preferredTimeWindow,
          contactPreference: parsedPayload.contactPreference,
          preferredMeetingLocation: parsedPayload.preferredMeetingLocation,
          preferredMeetingDate: parsedPayload.preferredMeetingDate,
          buddyName: parsedPayload.buddyName,
          workloadDetails: parsedPayload.workloadDetails,
          scheduleDetails: parsedPayload.scheduleDetails,
          photos: parsedPayload.photos || [],
          status: r.status || 'Submitted',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      // De-duplicate by ID
      const map = new Map<string, SupportRequestRecord>();
      inMemoryQueue.forEach((item) => map.set(item.id, item));
      dbRecords.forEach((item) => map.set(item.id, item));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn('SQLite query fallback in getSupportRequestsForUser:', err);
  }

  return inMemoryQueue;
}

/**
 * Retrieves all items in the Welfare Officer queue.
 */
export async function getAllSupportRequestsForQueue(): Promise<SupportRequestRecord[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM support_requests ORDER BY created_at DESC'
    );

    if (rows && rows.length > 0) {
      const dbRecords: SupportRequestRecord[] = rows.map((r) => {
        let parsedPayload: any = {};
        try {
          parsedPayload = JSON.parse(r.notes);
        } catch {
          parsedPayload = { notes: r.notes };
        }

        return {
          id: r.id,
          personId: r.person_id,
          personName: r.is_anonymous ? 'Protected Whistleblower' : (r.person_id === 'anon' ? 'Protected Whistleblower' : 'Rohan Verma'),
          unit: 'Unit 402',
          requestType: r.request_type as SupportOptionType,
          categoryTitle: r.category || 'Support Request',
          isAnonymous: Boolean(r.is_anonymous),
          priority: (parsedPayload.priority as SupportPriority) || 'normal',
          facilityCategory: parsedPayload.facilityCategory as FacilityCategory,
          location: parsedPayload.location,
          notes: parsedPayload.notes || r.notes || '',
          preferredTimeWindow: parsedPayload.preferredTimeWindow,
          contactPreference: parsedPayload.contactPreference,
          preferredMeetingLocation: parsedPayload.preferredMeetingLocation,
          preferredMeetingDate: parsedPayload.preferredMeetingDate,
          buddyName: parsedPayload.buddyName,
          workloadDetails: parsedPayload.workloadDetails,
          scheduleDetails: parsedPayload.scheduleDetails,
          photos: parsedPayload.photos || [],
          status: r.status || 'Submitted',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      const map = new Map<string, SupportRequestRecord>();
      inMemoryQueue.forEach((item) => map.set(item.id, item));
      dbRecords.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn('SQLite queue fetch fallback:', err);
  }

  return inMemoryQueue;
}

/**
 * Updates status and officer notes on a ticket from the Welfare Officer portal.
 */
export async function updateSupportRequestStatus(
  id: string,
  status: SupportRequestRecord['status'],
  officerNotes?: string,
  assignedOfficer?: string
): Promise<void> {
  const now = new Date().toISOString();

  // Update in-memory
  inMemoryQueue = inMemoryQueue.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        officerNotes: officerNotes !== undefined ? officerNotes : item.officerNotes,
        assignedOfficer: assignedOfficer !== undefined ? assignedOfficer : item.assignedOfficer,
        updatedAt: now,
      };
    }
    return item;
  });

  // Update SQLite
  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE support_requests SET status = ?, updated_at = ? WHERE id = ?',
      [status, now, id]
    );
  } catch (err) {
    console.warn('SQLite updateSupportRequestStatus fallback:', err);
  }
}

/**
 * Backward compatibility alias for getSupportRequests
 */
export async function getSupportRequests(personId: string): Promise<any[]> {
  return getSupportRequestsForUser(personId);
}
