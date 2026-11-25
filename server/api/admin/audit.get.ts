import { listAudit } from '../../services/admin'

export default defineAdminHandler(({ db }) => listAudit(db))
