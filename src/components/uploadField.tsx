import { useAppDispatch } from '@/hooks/useRedux'
import { endLoading, startLoading } from '@/store/loading.slice'
import { formatStatistics, syncNotes } from '@/store/statistics.slice'
import { FileUpload, HStack, Button, FileUploadFileChangeDetails } from '@chakra-ui/react'
import { LuUpload } from 'react-icons/lu'
import { toaster } from '@/components/ui/toaster'
import initSqlJs from 'sql.js'

export const UploadField = ({ showFile = true }: { showFile?: boolean }) => {
    const dispatch = useAppDispatch()

    const uploadFile = async (e: FileUploadFileChangeDetails) => {
        dispatch(startLoading())
        try {
            const SQL = await initSqlJs({
                locateFile: (file) => `https://sql.js.org/dist/${file}`,
            })
            const file = e.acceptedFiles[0]
            const arrayBuffer = await file.arrayBuffer()
            const unitArray = new Uint8Array(arrayBuffer)

            const db = new SQL.Database(unitArray)
            const res = db.exec(`
                    SELECT Date, Title, Author,
                    CAST(printf('%.1f', SUM(ReadingTime) / 60.0) AS REAL) AS TotalMinutesRead
                    FROM Analytics
                    GROUP BY Date, Title
                    HAVING TotalMinutesRead >= 1;
                `)

            await dispatch(formatStatistics(res[0].values))

            const notes = db.exec(`
                    SELECT Title, DateCreated, Text, Annotation, Type,
                    strftime( '%Y-%m-%d',DateCreated, 'localtime') as DateString 
                    FROM Bookmark 
                    WHERE Text is NOT NULL OR Type != 'dogear'
                    ORDER BY Title, DateString ASC
                `)
            await dispatch(syncNotes(notes[0].values))
        } catch (e) {
            toaster.create({
                title: `讀取失敗 (${e})`,
                type: 'error',
            })
        } finally {
            dispatch(endLoading())
        }
    }

    return (
        <FileUpload.Root
            onFileChange={uploadFile}
            accept={'.sqlite'}
            flexDirection="row"
            alignItems="center"
        >
            <FileUpload.HiddenInput />
            <FileUpload.Trigger asChild>
                <HStack h="54px">
                    <Button variant="outline" size="sm" borderColor="gray.300">
                        <LuUpload /> Upload file
                    </Button>
                </HStack>
            </FileUpload.Trigger>
            {showFile ? <FileUpload.List /> : <></>}
        </FileUpload.Root>
    )
}
