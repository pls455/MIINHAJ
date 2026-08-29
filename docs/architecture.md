# Minhaj 2.0 Architecture

## Principles

- HTML5 + CSS3 + Vanilla JavaScript ES Modules only.
- Firebase is accessed through service/repository layers, never directly from page HTML.
- Public resource lists are paginated and cursor-based. Pages never load the complete `resources` collection.
- Admin sections load data lazily when opened.
- AI never receives the full resource database. Retrieval happens first; Gemini receives only relevant context.
- Existing Firebase data is preserved. No destructive migration is part of the rebuild.
- `stableId` is the application-level identity for entities whose relationships must survive renaming.

## Runtime layers

```text
HTML pages
  -> page controllers
  -> reusable components
  -> repositories
  -> Firebase services
  -> Firestore

AI UI
  -> aiService
  -> Cloudflare Worker
  -> retrieval / validation
  -> Gemini
```

## Directory contract

```text
css/
  variables.css
  main.css
  components.css
  layout.css
  responsive.css
  admin.css

js/
  app.js
  config/
  core/
  components/
  pages/
  admin/
  repositories/
  services/
    firebase/
    ai/
    cloudflare/
  tools/
  utils/

cloudflare-worker/
  src/

admin/

scripts/

docs/
```

## Data model

The existing production collections remain authoritative. The following is the normalized application contract; adapters may accept legacy field aliases while writing the canonical fields.

### branches

- `stableId`: string, immutable application identifier
- `name`: string
- `description`: string
- `icon`: string
- `order`: number
- `active`: boolean
- `createdAt`, `updatedAt`: timestamps

### subjects

- `stableId`: string
- `name`: string
- `branchIds`: string[]
- `description`: string
- `icon`: string
- `order`: number
- `active`: boolean
- `createdAt`, `updatedAt`: timestamps

### categories

- `stableId`: string
- `name`: string
- `description`: string
- `icon`: string
- `order`: number
- `active`: boolean
- optional `subjectIds` / `branchIds` where the existing data model already uses them

### resources

- `title`: string
- `description`: string
- `url`: string
- `type`: string
- `categoryId`: string
- `subjectId`: string
- `branchIds`: string[]
- `keywords`: string[]
- `tags`: string[]
- `author`: string
- `order`: number
- `active`: boolean
- `createdAt`, `updatedAt`: timestamps

The repository layer must tolerate legacy `branchId` while normalizing reads to `branchIds`.

### foundations

- `branchId` / `branchIds`
- `subjectId`
- `title`
- `description`
- `url`
- `type`
- `order`
- `active`
- timestamps

### solutions

- title/content fields from the existing dataset
- `branchIds`
- `subjectId`
- category/type metadata where present
- `active`, `order`, timestamps

### flashcards

- `branchId` / `branchIds`
- `subjectId`
- `question`
- `answer`
- `explanation`
- `order`
- `active`
- timestamps

### suggestions

- user-submitted suggestion fields retained from production data
- `status`: pending / approved / rejected / other existing states
- reviewer/admin metadata and timestamps

### problemReports

- report content retained from production data
- related `resourceId` when present
- `status`
- processing metadata and timestamps

### sourceRegistry

Source ingestion metadata is separate from published resources.

- `provider`
- `sourceType`
- `driveId` where applicable
- `title`, `originalTitle`
- `url`
- `mimeType`, `size`, `modifiedTime`
- `detectedPath`
- `branchIds`, `subjectId`, `categoryId`
- `status`
- `autoSuggested`
- `needsReview`
- `classificationConflict`
- creator/update metadata

### templates

Existing template schema remains authoritative. Repository methods expose create, update, delete, clone, get and list operations without leaking Firestore details into UI code.

### admins

- document ID = Firebase Auth UID
- `email`
- `role`: `reviewer | content_admin | super_admin`
- `active`: boolean
- timestamps

Legacy role aliases are read-compatible only. New application writes use the canonical names.

### adminLogs

- `adminUid`
- `adminEmail`
- `role`
- `action`
- `collection`
- `targetId`
- `details`
- `timestamp`

## Repository API

Repositories own Firestore query construction and normalization.

### Resource repository

```js
getResources({ filters, pageSize, cursor })
searchResources({ query, filters, pageSize, cursor })
getResource(id)
getResourcesBySubject(subjectId, options)
getResourcesByBranch(branchId, options)
getResourcesByCategory(categoryId, options)
```

The list result is shaped as `{ items, nextCursor, hasMore }`. No method silently loads the entire collection.

### Other repositories

- `branchRepository`
- `subjectRepository`
- `categoryRepository`
- `foundationRepository`
- `solutionRepository`
- `flashcardRepository`
- `suggestionRepository`
- `problemReportRepository`
- `templateRepository`
- `sourceRegistryRepository`
- `adminRepository`
- `adminLogRepository`

Each repository exposes domain operations and hides Firestore SDK details.

## Admin permissions

Canonical levels:

| Role | Level | Scope |
|---|---:|---|
| reviewer | 1 | review queues, suggestions/reports and permitted review operations |
| content_admin | 2 | content CRUD plus reviewer operations |
| super_admin | 3 | all content, admin management, logs and system operations |

Authorization is enforced twice: UI guards improve UX, Firestore Rules enforce security.

## Query strategy

Resource browsing uses:

- equality filters for indexed dimensions such as `active`, `subjectId`, `categoryId` where supported by the real dataset;
- array membership for `branchIds` where appropriate;
- `orderBy` + `limit` + `startAfter` pagination;
- debounced search;
- bounded result sets.

Free-text search that cannot be represented efficiently by Firestore is routed through a bounded retrieval/search strategy rather than downloading the entire collection.

## AI retrieval contract

```text
user question
  -> classify intent / extract filters
  -> Firestore bounded retrieval
  -> rank top candidates
  -> send only top-K metadata/content to Worker
  -> Gemini answer or classification
  -> validate IDs against known data
  -> return answer + source references
```

AI classification must return `confidence`, `evidence`, and `needsReview` where applicable. An AI-generated ID is accepted only if it exists in the supplied reference set.

## Migration policy

- No destructive migration.
- No deletion of production collections.
- New canonical fields are introduced only after reading the real schema.
- Migration scripts must be idempotent and dry-run capable.
- Existing IDs are preserved.
- Any schema transition is reversible where practical and produces an audit log.
