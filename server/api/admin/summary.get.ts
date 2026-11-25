import { adminSummary } from '../../services/admin'

export default defineAdminHandler(({ db }) => adminSummary(db))
