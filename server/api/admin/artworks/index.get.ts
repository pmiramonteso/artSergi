import { listArtworksAdmin } from '../../../services/admin'

export default defineAdminHandler(({ db }) => listArtworksAdmin(db))
