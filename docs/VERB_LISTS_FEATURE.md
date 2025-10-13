# Custom Verb Lists Feature

## Overview
This feature allows users to create custom named lists of verbs for studying, in addition to the existing favorites functionality.

## What Was Implemented

### Backend

#### Database
- **Migration**: `2025_10_13_000001_create_verb_lists_table.php`
  - Stores user-created verb lists with name, description, and order
  
- **Migration**: `2025_10_13_000002_create_verb_list_items_table.php`
  - Stores the verbs in each list with optional notes and ordering

#### Models
- **VerbList** (`app/Models/VerbList.php`)
  - Represents a user's custom verb list
  - Relationships: belongs to User, has many VerbListItems, belongs to many Verbs
  
- **VerbListItem** (`app/Models/VerbListItem.php`)
  - Pivot model for verbs in lists with additional fields (notes, order)

#### Controller
- **VerbListController** (`app/Http/Controllers/VerbListController.php`)
  - Full CRUD operations for verb lists
  - Add/remove verbs from lists
  - Bulk add verbs
  - API endpoints for fetching lists

#### Policy
- **VerbListPolicy** (`app/Policies/VerbListPolicy.php`)
  - Authorization for viewing, updating, and deleting lists

#### Routes
All routes are in `routes/web.php` under the authenticated middleware:
- `GET /verb-lists` - List all user's verb lists
- `GET /verb-lists/create` - Create new list form
- `POST /verb-lists` - Store new list
- `GET /verb-lists/{list}` - View list with verbs
- `GET /verb-lists/{list}/edit` - Edit list form
- `PATCH /verb-lists/{list}` - Update list
- `DELETE /verb-lists/{list}` - Delete list
- `POST /verb-lists/{list}/verbs` - Add verb to list
- `POST /verb-lists/{list}/verbs/bulk` - Bulk add verbs
- `DELETE /verb-lists/{list}/verbs/{verb}` - Remove verb from list
- `PATCH /verb-lists/{list}/verbs/{verb}` - Update verb notes in list
- `GET /api/verb-lists` - Get all lists (JSON)
- `GET /api/verbs/{verb}/lists` - Get lists containing a verb (JSON)

### Frontend

#### Pages
- **Index** (`resources/js/Pages/Verbs/Lists/Index.tsx`)
  - Display all user's verb lists in a card grid
  - Shows count of verbs in each list
  
- **Create** (`resources/js/Pages/Verbs/Lists/Create.tsx`)
  - Form to create a new verb list with name and description
  
- **Edit** (`resources/js/Pages/Verbs/Lists/Edit.tsx`)
  - Form to edit list name/description or delete the list
  
- **Show** (`resources/js/Pages/Verbs/Lists/Show.tsx`)
  - Display verbs in a list with search and pagination
  - Remove verbs from list
  - Link to add more verbs

#### Components
- **AddToListModal** (`resources/js/Components/AddToListModal.tsx`)
  - Modal dialog to add a verb to one or more lists
  - Shows checkboxes for all user's lists
  - Indicates which lists already contain the verb
  - Option to create a new list

#### Updated Pages
- **Verbs/Index.tsx**
  - Added "Add to List" button (list icon) next to favorite button
  - Added "My Lists" link in navigation
  - Opens AddToListModal when list icon is clicked

## How to Use

### Creating a List
1. Navigate to `/verb-lists` or click "My Lists" from the verbs page
2. Click "Create New List"
3. Enter a name (required) and optional description
4. Click "Create List"

### Adding Verbs to a List
**Option 1: From Verb Browser**
1. Go to `/verbs` to browse all verbs
2. Click the list icon next to any verb
3. Check the lists you want to add the verb to
4. The verb is instantly added/removed when you toggle checkboxes

**Option 2: From List Page**
1. Open a list from `/verb-lists`
2. Click "Add Verbs"
3. Browse verbs and use the list icon to add them

### Managing Lists
- **View**: Click on a list name to see all verbs in it
- **Edit**: Click "Edit" button to change name/description
- **Delete**: Use the "Delete List" button in the edit page
- **Remove Verbs**: Click the trash icon next to any verb in the list

### Studying from Lists
Lists are organized and searchable, making it easy to:
- Group verbs by topic (e.g., "Kitchen Verbs", "Travel Verbs")
- Create difficulty-based lists (e.g., "Beginner Verbs", "Advanced Verbs")
- Build themed collections (e.g., "Irregular Verbs", "Reflexive Verbs")

## Key Features
- ✅ Create unlimited custom lists
- ✅ Name and describe each list
- ✅ Add verbs to multiple lists
- ✅ Search within lists
- ✅ Reorder lists (via order_index field)
- ✅ Add optional notes to verbs in lists
- ✅ Quick add from verb browser
- ✅ Separate from favorites system

## Future Enhancements (Optional)
- Drag-and-drop reordering of verbs within lists
- Share lists with other users
- Export lists to PDF or flashcards
- Practice mode specifically for a list
- List templates (common verb categories)
