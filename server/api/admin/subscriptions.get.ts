import { listSubscriptionsAdmin } from '../../services/admin'

export default defineAdminHandler(({ db }) => listSubscriptionsAdmin(db))
