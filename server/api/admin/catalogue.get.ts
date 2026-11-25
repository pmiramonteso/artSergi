import { listCatalogue } from '../../services/admin'

export default defineAdminHandler(({ db }) => listCatalogue(db))
