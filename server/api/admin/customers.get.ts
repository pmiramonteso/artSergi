import { listCustomersAdmin } from '../../services/admin'

export default defineAdminHandler(({ db }) => listCustomersAdmin(db))
